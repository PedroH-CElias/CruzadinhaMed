package com.cruzadinha.med.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Proteção contra tentativas de adivinhar senhas (força bruta) por conta.
 *
 * Regra: depois de {@value #MAX_FAILURES} senhas erradas para o mesmo e-mail dentro de
 * 15 minutos, o login desse e-mail fica bloqueado por 15 minutos (HTTP 429).
 * Um login correto zera a contagem.
 *
 * LIMITAÇÃO: a contagem fica na memória do servidor. Ela zera quando o backend reinicia e
 * não é compartilhada entre várias instâncias. Se um dia houver mais de um servidor,
 * trocar este mapa por um armazenamento compartilhado (ex.: Redis).
 */
@Service
public class LoginAttemptService {

	/** Senhas erradas permitidas dentro da janela. */
	static final int MAX_FAILURES = 5;

	/** Janela de contagem das falhas. */
	private static final Duration WINDOW = Duration.ofMinutes(15);

	/** Tempo de bloqueio depois de atingir o limite. */
	private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

	/** Limpa entradas antigas quando o mapa passa deste tamanho (evita crescer sem limite). */
	private static final int CLEANUP_THRESHOLD = 10_000;

	/** Situação de um e-mail: falhas na janela atual e até quando está bloqueado. */
	private static final class Attempts {
		int failures;
		Instant windowStart;
		Instant lockedUntil;
	}

	private final Map<String, Attempts> attemptsByEmail = new ConcurrentHashMap<>();

	/**
	 * Verifica se o e-mail pode tentar login agora.
	 *
	 * @throws ResponseStatusException 429 se o e-mail estiver bloqueado
	 */
	public void checkAllowed(String email) {
		Attempts attempts = attemptsByEmail.get(key(email));
		if (attempts == null) {
			return;
		}
		synchronized (attempts) {
			if (attempts.lockedUntil != null && Instant.now().isBefore(attempts.lockedUntil)) {
				throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
						"Muitas tentativas de login. Tente novamente em alguns minutos.");
			}
		}
	}

	/** Registra uma senha errada e bloqueia o e-mail se o limite for atingido. */
	public void recordFailure(String email) {
		cleanupIfNeeded();
		Instant now = Instant.now();
		Attempts attempts = attemptsByEmail.computeIfAbsent(key(email), k -> new Attempts());
		synchronized (attempts) {
			// Começa uma nova janela se não havia uma ou se a anterior já passou
			if (attempts.windowStart == null || now.isAfter(attempts.windowStart.plus(WINDOW))) {
				attempts.windowStart = now;
				attempts.failures = 0;
			}
			attempts.failures++;
			if (attempts.failures >= MAX_FAILURES) {
				attempts.lockedUntil = now.plus(LOCK_DURATION);
				attempts.failures = 0;
				attempts.windowStart = null;
			}
		}
	}

	/** Login correto (ou senha redefinida): zera a contagem do e-mail. */
	public void recordSuccess(String email) {
		attemptsByEmail.remove(key(email));
	}

	private static String key(String email) {
		return email.trim().toLowerCase();
	}

	/** Remove registros que não estão bloqueados nem têm janela ativa. */
	private void cleanupIfNeeded() {
		if (attemptsByEmail.size() < CLEANUP_THRESHOLD) {
			return;
		}
		Instant now = Instant.now();
		attemptsByEmail.entrySet().removeIf(entry -> {
			Attempts a = entry.getValue();
			synchronized (a) {
				boolean locked = a.lockedUntil != null && now.isBefore(a.lockedUntil);
				boolean windowActive = a.windowStart != null && now.isBefore(a.windowStart.plus(WINDOW));
				return !locked && !windowActive;
			}
		});
	}
}

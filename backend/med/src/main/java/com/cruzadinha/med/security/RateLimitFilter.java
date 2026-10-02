package com.cruzadinha.med.security;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Limite de requisições por IP nas rotas públicas sensíveis (login, cadastro e
 * redefinição de senha). Protege contra robôs que disparam muitas tentativas.
 *
 * Regra: no máximo {@value #MAX_REQUESTS_PER_WINDOW} requisições por minuto por IP,
 * somando todas as rotas protegidas. Acima disso responde HTTP 429 com o header
 * {@code Retry-After}.
 *
 * Observações:
 * - A contagem fica em memória (zera ao reiniciar; não é compartilhada entre servidores).
 * - O IP usado é o da conexão ({@code getRemoteAddr}). Se o backend ficar atrás de um proxy
 *   ou balanceador, configurar {@code server.forward-headers-strategy=native} para que o
 *   IP real do cliente seja considerado.
 * - Usuários na mesma rede (ex.: Wi-Fi de uma faculdade) podem compartilhar o mesmo IP;
 *   o limite foi escolhido com folga para isso.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

	/** Requisições permitidas por IP em cada janela. */
	static final int MAX_REQUESTS_PER_WINDOW = 20;

	/** Tamanho da janela de contagem. */
	private static final Duration WINDOW = Duration.ofMinutes(1);

	/** Limpa janelas antigas quando o mapa passa deste tamanho. */
	private static final int CLEANUP_THRESHOLD = 10_000;

	/** Rotas protegidas (todas via POST). */
	private static final Set<String> PROTECTED_PATHS = Set.of(
			"/auth/login",
			"/auth/forgot-password",
			"/auth/reset-password",
			"/users");

	/** Contagem de uma janela: início e número de requisições. */
	private static final class Window {
		Instant start;
		int count;
	}

	private final Map<String, Window> windowsByIp = new ConcurrentHashMap<>();

	/** Só aplica o filtro nos POSTs das rotas protegidas. */
	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !"POST".equalsIgnoreCase(request.getMethod())
				|| !PROTECTED_PATHS.contains(request.getRequestURI());
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {

		cleanupIfNeeded();
		Instant now = Instant.now();
		Window window = windowsByIp.computeIfAbsent(request.getRemoteAddr(), ip -> new Window());

		long retryAfterSeconds;
		synchronized (window) {
			// Nova janela se não havia uma ou se a anterior terminou
			if (window.start == null || !now.isBefore(window.start.plus(WINDOW))) {
				window.start = now;
				window.count = 0;
			}
			window.count++;
			if (window.count <= MAX_REQUESTS_PER_WINDOW) {
				retryAfterSeconds = 0;
			} else {
				retryAfterSeconds = Math.max(1, Duration.between(now, window.start.plus(WINDOW)).toSeconds());
			}
		}

		if (retryAfterSeconds == 0) {
			chain.doFilter(request, response);
			return;
		}

		// Limite excedido: responde 429 sem chegar ao controller
		response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
		response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding("UTF-8");
		response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\","
				+ "\"message\":\"Muitas requisições. Aguarde um pouco e tente de novo.\"}");
	}

	/** Remove janelas que já terminaram. */
	private void cleanupIfNeeded() {
		if (windowsByIp.size() < CLEANUP_THRESHOLD) {
			return;
		}
		Instant now = Instant.now();
		windowsByIp.entrySet().removeIf(entry -> {
			Window w = entry.getValue();
			synchronized (w) {
				return w.start == null || !now.isBefore(w.start.plus(WINDOW));
			}
		});
	}
}

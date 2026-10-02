package com.cruzadinha.med.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cruzadinha.med.dto.ForgotPasswordRequestDTO;
import com.cruzadinha.med.dto.ResetPasswordRequestDTO;
import com.cruzadinha.med.entities.PasswordResetCode;
import com.cruzadinha.med.entities.User;
import com.cruzadinha.med.repositories.PasswordResetCodeRepository;
import com.cruzadinha.med.repositories.RefreshTokenRepository;
import com.cruzadinha.med.repositories.UserRepository;
import com.cruzadinha.med.security.LoginAttemptService;

/**
 * Fluxo de "esqueci minha senha" com código de 6 dígitos enviado por e-mail.
 *
 * 1. {@link #requestReset}: gera o código e envia por e-mail. A resposta ao app é sempre a
 *    mesma, exista ou não a conta, para não revelar quais e-mails estão cadastrados.
 * 2. {@link #resetPassword}: confere o código e troca a senha. Todas as sessões abertas
 *    são encerradas, porque quem pede redefinição pode estar com a conta comprometida.
 */
@Service
public class PasswordResetService {

	/** Validade do código. */
	public static final Duration CODE_VALIDITY = Duration.ofMinutes(15);

	/** Tentativas com código errado antes de o código ser invalidado. */
	private static final int MAX_ATTEMPTS = 5;

	/** Intervalo mínimo entre dois envios para o mesmo usuário (evita spam de e-mails). */
	private static final Duration RESEND_INTERVAL = Duration.ofSeconds(60);

	private static final String INVALID_CODE = "Código inválido ou expirado";

	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordResetCodeRepository codeRepository;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private EmailService emailService;

	@Autowired
	private LoginAttemptService loginAttemptService;

	/**
	 * Gera e envia um novo código, se a conta existir. Não lança erro se não existir.
	 */
	@Transactional
	public void requestReset(ForgotPasswordRequestDTO dto) {
		String email = normalize(dto.getEmail());
		Optional<User> found = userRepository.findByEmail(email);
		if (found.isEmpty()) {
			return; // mesma resposta para o app, sem revelar que o e-mail não existe
		}

		User user = found.get();
		Instant now = Instant.now();

		// Se um código foi enviado há menos de 60s, não envia outro (proteção contra spam)
		Optional<PasswordResetCode> last = codeRepository.findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId());
		if (last.isPresent() && last.get().getCreatedAt().plus(RESEND_INTERVAL).isAfter(now)) {
			return;
		}

		// Só o código mais novo vale: invalida os anteriores
		codeRepository.invalidateAllActiveByUser(user.getId(), now);

		String code = generateCode();
		codeRepository.save(new PasswordResetCode(user, hash(user.getId(), code), now, now.plus(CODE_VALIDITY)));

		emailService.sendPasswordResetCode(user.getEmail(), user.getName(), code, CODE_VALIDITY.toMinutes());
	}

	/**
	 * Confere o código e troca a senha.
	 *
	 * O {@code noRollbackFor} garante que a contagem de tentativas erradas seja salva mesmo
	 * quando a resposta é um erro (senão o limite de 5 tentativas nunca seria atingido).
	 *
	 * @throws ResponseStatusException 422 se o código estiver errado, expirado ou esgotado
	 */
	@Transactional(noRollbackFor = ResponseStatusException.class)
	public void resetPassword(ResetPasswordRequestDTO dto) {
		String email = normalize(dto.getEmail());
		User user = userRepository.findByEmail(email).orElseThrow(PasswordResetService::invalidCode);
		Instant now = Instant.now();

		PasswordResetCode resetCode = codeRepository.findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId())
				.orElseThrow(PasswordResetService::invalidCode);

		if (resetCode.isExpired(now) || resetCode.getAttempts() >= MAX_ATTEMPTS) {
			resetCode.setUsedAt(now);
			throw invalidCode();
		}

		if (!MessageDigest.isEqual(
				resetCode.getCodeHash().getBytes(StandardCharsets.UTF_8),
				hash(user.getId(), dto.getCode()).getBytes(StandardCharsets.UTF_8))) {
			resetCode.registerFailedAttempt();
			if (resetCode.getAttempts() >= MAX_ATTEMPTS) {
				resetCode.setUsedAt(now); // esgotou as tentativas: código não vale mais
			}
			throw invalidCode();
		}

		// Código correto: troca a senha e encerra todas as sessões abertas
		resetCode.setUsedAt(now);
		user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
		userRepository.save(user);
		refreshTokenRepository.revokeAllActiveByUser(user.getId(), now);

		// Libera o login caso a conta estivesse bloqueada por senhas erradas
		loginAttemptService.recordSuccess(email);
	}

	/** Gera um código numérico de 6 dígitos (000000 a 999999). */
	private static String generateCode() {
		return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
	}

	/**
	 * Hash do código. Inclui o id do usuário para que códigos iguais de usuários
	 * diferentes gerem hashes diferentes.
	 */
	private static String hash(Long userId, String code) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] bytes = digest.digest((userId + ":" + code).getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(bytes);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 indisponível na JVM", e);
		}
	}

	private static String normalize(String email) {
		return email.trim().toLowerCase();
	}

	private static ResponseStatusException invalidCode() {
		return new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, INVALID_CODE);
	}
}

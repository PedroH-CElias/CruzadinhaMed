package com.cruzadinha.med.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cruzadinha.med.dto.LoginRequestDTO;
import com.cruzadinha.med.dto.RefreshRequestDTO;
import com.cruzadinha.med.dto.TokenResponseDTO;
import com.cruzadinha.med.entities.RefreshToken;
import com.cruzadinha.med.entities.Role;
import com.cruzadinha.med.entities.User;
import com.cruzadinha.med.repositories.RefreshTokenRepository;
import com.cruzadinha.med.repositories.UserRepository;
import com.cruzadinha.med.security.LoginAttemptService;

/**
 * Regras de autenticação do app: login, renovação de sessão e logout.
 *
 * Fluxo:
 * 1. Login: o app envia e-mail e senha e recebe um token de acesso (JWT, curto) e um
 *    refresh token (opaco, longo).
 * 2. O app usa o token de acesso nas chamadas protegidas. Quando ele expira (HTTP 401),
 *    o app chama o refresh e recebe um novo par de tokens.
 * 3. Logout: o refresh token é revogado e não pode mais ser usado.
 *
 * Não existe client-id/client-secret: num app mobile qualquer segredo embutido pode ser
 * extraído, então a única credencial é a senha do próprio usuário.
 */
@Service
public class AuthService {

	/** Emissor (claim "iss") gravado nos tokens de acesso. */
	private static final String ISSUER = "cruzadinhamed";

	private static final String INVALID_CREDENTIALS = "E-mail ou senha inválidos";
	private static final String INVALID_SESSION = "Sessão expirada. Faça login novamente.";

	/** Gerador de números aleatórios criptograficamente seguro para os refresh tokens. */
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	/**
	 * Hash BCrypt de uma senha qualquer. Usado quando o e-mail não existe, para que o
	 * login demore o mesmo tempo nos dois casos e não revele quais e-mails têm conta.
	 */
	private static final String DUMMY_PASSWORD_HASH = "$2a$10$zMYHbCHGd8iw2dJ3hYWNkOL76C2p.OT5g9ZgEAborVI1C1qnTO.By";

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private JwtEncoder jwtEncoder;

	@Autowired
	private LoginAttemptService loginAttemptService;

	/** Validade do token de acesso, em segundos (padrão: 900 = 15 minutos). */
	@Value("${security.jwt.access-token-duration}")
	private long accessTokenSeconds;

	/** Validade do refresh token, em segundos (padrão: 2592000 = 30 dias). */
	@Value("${security.jwt.refresh-token-duration}")
	private long refreshTokenSeconds;

	/**
	 * Autentica o usuário com e-mail e senha e abre uma nova sessão.
	 *
	 * @throws ResponseStatusException 401 se o e-mail não existir ou a senha estiver errada
	 *         (mesma mensagem nos dois casos, de propósito)
	 * @throws ResponseStatusException 429 se o e-mail estiver bloqueado por excesso de senhas erradas
	 */
	@Transactional
	public TokenResponseDTO login(LoginRequestDTO dto) {
		String email = dto.getEmail().trim().toLowerCase();

		// Bloqueio temporário após várias senhas erradas (ver LoginAttemptService)
		loginAttemptService.checkAllowed(email);

		Optional<User> user = userRepository.findByEmail(email);

		if (user.isEmpty()) {
			// Compara com um hash falso só para gastar o mesmo tempo de um login real
			passwordEncoder.matches(dto.getPassword(), DUMMY_PASSWORD_HASH);
			loginAttemptService.recordFailure(email);
			throw unauthorized(INVALID_CREDENTIALS);
		}
		if (!passwordEncoder.matches(dto.getPassword(), user.get().getPassword())) {
			loginAttemptService.recordFailure(email);
			throw unauthorized(INVALID_CREDENTIALS);
		}

		loginAttemptService.recordSuccess(email);
		return issueTokens(user.get(), Instant.now());
	}

	/**
	 * Troca um refresh token válido por um novo par de tokens (rotação).
	 *
	 * Se um refresh token JÁ USADO for apresentado de novo, é sinal de que ele foi copiado
	 * por outra pessoa. Nesse caso todas as sessões do usuário são encerradas.
	 *
	 * O {@code noRollbackFor} é necessário: sem ele, a exceção 401 desfaria a revogação
	 * geral das sessões feita logo antes de lançá-la.
	 *
	 * @throws ResponseStatusException 401 se o token não existir, já tiver sido usado ou expirado
	 */
	@Transactional(noRollbackFor = ResponseStatusException.class)
	public TokenResponseDTO refresh(RefreshRequestDTO dto) {
		Instant now = Instant.now();
		RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(dto.getRefreshToken()))
				.orElseThrow(() -> unauthorized(INVALID_SESSION));

		if (stored.isRevoked()) {
			refreshTokenRepository.revokeAllActiveByUser(stored.getUser().getId(), now);
			throw unauthorized(INVALID_SESSION);
		}
		if (stored.isExpired(now)) {
			throw unauthorized(INVALID_SESSION);
		}

		// Rotação: o token usado agora não vale mais (a alteração é salva no fim da transação)
		stored.setRevokedAt(now);
		return issueTokens(stored.getUser(), now);
	}

	/**
	 * Encerra a sessão revogando o refresh token. Não falha se o token não existir ou
	 * já estiver revogado, para o logout do app sempre funcionar.
	 */
	@Transactional
	public void logout(RefreshRequestDTO dto) {
		refreshTokenRepository.findByTokenHash(hash(dto.getRefreshToken()))
				.filter(token -> !token.isRevoked())
				.ifPresent(token -> token.setRevokedAt(Instant.now()));
	}

	/**
	 * Emite um novo token de acesso (JWT) e um novo refresh token para o usuário.
	 * O refresh token é devolvido ao app em texto puro, mas só o hash dele é salvo.
	 */
	private TokenResponseDTO issueTokens(User user, Instant now) {
		String accessToken = createAccessToken(user, now);

		String refreshToken = generateRefreshToken();
		refreshTokenRepository.save(new RefreshToken(hash(refreshToken), user, now,
				now.plusSeconds(refreshTokenSeconds)));

		return new TokenResponseDTO(accessToken, refreshToken, accessTokenSeconds);
	}

	/**
	 * Monta e assina o JWT de acesso.
	 *
	 * As claims {@code username} e {@code authorities} seguem os nomes que o restante do
	 * backend já espera: o {@code UserService.authenticated()} lê o "username" e o
	 * {@code ResourceServerConfig} converte "authorities" nos perfis do Spring Security.
	 */
	private String createAccessToken(User user, Instant now) {
		List<String> authorities = user.getRoles().stream().map(Role::getAuthority).toList();

		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer(ISSUER)
				.subject(user.getEmail())
				.issuedAt(now)
				.expiresAt(now.plusSeconds(accessTokenSeconds))
				.claim("username", user.getEmail())
				.claim("authorities", authorities)
				.build();

		JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).build();
		return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}

	/** Gera um refresh token com 256 bits aleatórios, em Base64 seguro para URL. */
	private static String generateRefreshToken() {
		byte[] bytes = new byte[32];
		SECURE_RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	/** Calcula o SHA-256 (em hexadecimal) de um refresh token para salvar/buscar no banco. */
	private static String hash(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 indisponível na JVM", e);
		}
	}

	private static ResponseStatusException unauthorized(String message) {
		return new ResponseStatusException(HttpStatus.UNAUTHORIZED, message);
	}
}

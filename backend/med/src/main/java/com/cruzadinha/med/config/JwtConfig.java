package com.cruzadinha.med.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.util.StringUtils;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

/**
 * Configuração da assinatura e validação dos tokens JWT.
 *
 * O backend usa um par de chaves RSA:
 * - a chave PRIVADA assina os tokens de acesso emitidos no login ({@link JwtEncoder});
 * - a chave PÚBLICA valida os tokens recebidos nas requisições ({@link JwtDecoder}),
 *   usado automaticamente pelo Resource Server configurado em {@link ResourceServerConfig}.
 *
 * DE ONDE VEM A CHAVE (propriedade {@code security.jwt.private-key}, ou variável de
 * ambiente {@code JWT_PRIVATE_KEY}):
 * - um caminho de arquivo PEM, ex.: {@code file:./secrets/jwt-private.pem}; ou
 * - o próprio conteúdo PEM (útil em hospedagens que só aceitam variáveis de ambiente;
 *   as quebras de linha podem ser escritas como "\n").
 * Só a chave privada é necessária: a pública é calculada a partir dela.
 *
 * A chave precisa estar no formato PKCS#8 ("-----BEGIN PRIVATE KEY-----"). Para gerar:
 * <pre>
 * openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out secrets/jwt-private.pem
 * </pre>
 *
 * SEM CHAVE CONFIGURADA:
 * - perfil {@code test}: gera uma chave temporária (os tokens deixam de valer ao reiniciar);
 * - qualquer outro perfil: a aplicação NÃO sobe, para nunca ir para produção sem chave fixa.
 *
 * NUNCA versionar a chave privada no Git (a pasta secrets/ e *.pem estão no .gitignore).
 */
@Configuration
public class JwtConfig {

	private static final Logger log = LoggerFactory.getLogger(JwtConfig.class);

	private static final String PEM_HEADER = "-----BEGIN PRIVATE KEY-----";
	private static final String PEM_FOOTER = "-----END PRIVATE KEY-----";

	/** Par de chaves RSA usado para assinar e validar os tokens. */
	private final RSAKey rsaKey;

	public JwtConfig(@Value("${security.jwt.private-key:}") String privateKey,
			ResourceLoader resourceLoader, Environment environment) {
		this.rsaKey = StringUtils.hasText(privateKey)
				? loadRsaKey(privateKey.trim(), resourceLoader)
				: generateTemporaryKey(environment);
	}

	/**
	 * Emissor de JWT: assina os tokens com a chave privada (algoritmo RS256).
	 * Usado pelo {@code AuthService} no login e na renovação de sessão.
	 */
	@Bean
	public JwtEncoder jwtEncoder() {
		JWKSet jwkSet = new JWKSet(rsaKey);
		JWKSource<SecurityContext> jwkSource = (jwkSelector, securityContext) -> jwkSelector.select(jwkSet);
		return new NimbusJwtEncoder(jwkSource);
	}

	/**
	 * Validador de JWT: confere a assinatura (chave pública) e a data de expiração
	 * dos tokens enviados no header {@code Authorization: Bearer <token>}.
	 */
	@Bean
	public JwtDecoder jwtDecoder() throws JOSEException {
		return NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();
	}

	/**
	 * Carrega a chave privada (de um arquivo ou do conteúdo PEM informado) e calcula a
	 * chave pública correspondente. O identificador da chave (kid) é derivado da própria
	 * chave, então é sempre o mesmo entre reinicializações.
	 */
	private static RSAKey loadRsaKey(String value, ResourceLoader resourceLoader) {
		String pem = value.startsWith("-----BEGIN") ? value.replace("\\n", "\n") : readResource(value, resourceLoader);
		try {
			RSAPrivateCrtKey privateKey = parsePkcs8(pem);
			RSAPublicKey publicKey = (RSAPublicKey) KeyFactory.getInstance("RSA")
					.generatePublic(new RSAPublicKeySpec(privateKey.getModulus(), privateKey.getPublicExponent()));
			log.info("Chave JWT carregada de security.jwt.private-key");
			return new RSAKey.Builder(publicKey).privateKey(privateKey).keyIDFromThumbprint().build();
		} catch (GeneralSecurityException | JOSEException | IllegalArgumentException e) {
			throw new IllegalStateException("Chave privada JWT inválida em security.jwt.private-key", e);
		}
	}

	/** Lê o conteúdo de um arquivo de chave (ex.: "file:./secrets/jwt-private.pem"). */
	private static String readResource(String location, ResourceLoader resourceLoader) {
		Resource resource = resourceLoader.getResource(location);
		if (!resource.exists()) {
			throw new IllegalStateException("Arquivo da chave JWT não encontrado: " + location
					+ " (o caminho relativo parte da pasta onde o backend é executado)");
		}
		try (InputStream in = resource.getInputStream()) {
			return new String(in.readAllBytes(), StandardCharsets.US_ASCII);
		} catch (IOException e) {
			throw new IllegalStateException("Não foi possível ler a chave JWT em " + location, e);
		}
	}

	/** Converte um PEM PKCS#8 ("BEGIN PRIVATE KEY") em chave privada RSA. */
	private static RSAPrivateCrtKey parsePkcs8(String pem) throws GeneralSecurityException {
		if (pem.contains("BEGIN RSA PRIVATE KEY")) {
			throw new IllegalStateException("A chave JWT está no formato PKCS#1. Converta para PKCS#8 com: "
					+ "openssl pkcs8 -topk8 -nocrypt -in chave-antiga.pem -out jwt-private.pem");
		}
		int start = pem.indexOf(PEM_HEADER);
		int end = pem.indexOf(PEM_FOOTER);
		if (start < 0 || end < start) {
			throw new IllegalStateException("O conteúdo de security.jwt.private-key não é uma chave PEM "
					+ "(esperado \"" + PEM_HEADER + "\")");
		}
		String base64 = pem.substring(start + PEM_HEADER.length(), end).replaceAll("\\s", "");
		PrivateKey key = KeyFactory.getInstance("RSA")
				.generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(base64)));
		if (!(key instanceof RSAPrivateCrtKey crtKey)) {
			throw new IllegalStateException("A chave JWT não contém os dados da chave pública (CRT)");
		}
		return crtKey;
	}

	/**
	 * Gera uma chave temporária, permitido SOMENTE no perfil test. Em qualquer outro
	 * perfil a aplicação para com uma mensagem explicando como configurar a chave.
	 */
	private static RSAKey generateTemporaryKey(Environment environment) {
		if (!environment.acceptsProfiles(Profiles.of("test"))) {
			throw new IllegalStateException("""
					Chave JWT não configurada. Defina security.jwt.private-key (ou a variável de ambiente \
					JWT_PRIVATE_KEY) com o caminho do arquivo PEM (ex.: file:./secrets/jwt-private.pem) \
					ou com o conteúdo da chave. Para gerar uma chave: \
					openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out secrets/jwt-private.pem""");
		}
		log.warn("security.jwt.private-key não configurada: usando chave TEMPORÁRIA (permitido só no perfil test). "
				+ "Os tokens de acesso deixam de valer quando o backend reinicia.");
		try {
			KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
			generator.initialize(2048);
			KeyPair keyPair = generator.generateKeyPair();
			return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
					.privateKey((RSAPrivateKey) keyPair.getPrivate())
					.keyIDFromThumbprint()
					.build();
		} catch (GeneralSecurityException | JOSEException e) {
			throw new IllegalStateException("Não foi possível gerar a chave RSA temporária", e);
		}
	}
}

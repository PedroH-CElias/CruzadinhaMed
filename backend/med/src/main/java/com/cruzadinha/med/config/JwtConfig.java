package com.cruzadinha.med.config;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.UUID;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

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
 * ATENÇÃO: hoje o par de chaves é gerado a cada inicialização da aplicação. Isso significa
 * que, ao reiniciar o backend, todos os tokens de acesso emitidos antes deixam de ser
 * válidos (o app se recupera sozinho usando o refresh token). Antes de ir para produção,
 * carregar a chave de um keystore ou variável de ambiente para que ela seja fixa.
 */
@Configuration
public class JwtConfig {

	/** Par de chaves RSA usado para assinar e validar os tokens. */
	private final RSAKey rsaKey = generateRsaKey();

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

	/** Gera um novo par de chaves RSA de 2048 bits com um identificador (kid) aleatório. */
	private static RSAKey generateRsaKey() {
		try {
			KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
			generator.initialize(2048);
			KeyPair keyPair = generator.generateKeyPair();
			return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
					.privateKey((RSAPrivateKey) keyPair.getPrivate())
					.keyID(UUID.randomUUID().toString())
					.build();
		} catch (Exception e) {
			throw new IllegalStateException("Não foi possível gerar a chave RSA dos tokens", e);
		}
	}
}

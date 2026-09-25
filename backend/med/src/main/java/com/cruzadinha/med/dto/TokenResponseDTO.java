package com.cruzadinha.med.dto;

/**
 * Resposta do login e da renovação de sessão.
 *
 * - {@code accessToken}: JWT curto, enviado pelo app em {@code Authorization: Bearer ...}
 * - {@code refreshToken}: token opaco e longo, usado apenas para obter um novo par de tokens
 * - {@code expiresIn}: validade do token de acesso, em segundos
 */
public class TokenResponseDTO {

	private final String accessToken;
	private final String refreshToken;
	private final String tokenType = "Bearer";
	private final long expiresIn;

	public TokenResponseDTO(String accessToken, String refreshToken, long expiresIn) {
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresIn = expiresIn;
	}

	public String getAccessToken() {
		return accessToken;
	}

	public String getRefreshToken() {
		return refreshToken;
	}

	public String getTokenType() {
		return tokenType;
	}

	public long getExpiresIn() {
		return expiresIn;
	}
}

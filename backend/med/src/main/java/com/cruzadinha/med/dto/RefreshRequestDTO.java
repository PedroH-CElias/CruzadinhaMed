package com.cruzadinha.med.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Corpo das requisições que operam sobre uma sessão existente:
 * renovação ({@code POST /auth/refresh}) e logout ({@code POST /auth/logout}).
 */
public class RefreshRequestDTO {

	@NotBlank(message = "Refresh token é obrigatório")
	private String refreshToken;

	public RefreshRequestDTO() {
	}

	public String getRefreshToken() {
		return refreshToken;
	}

	public void setRefreshToken(String refreshToken) {
		this.refreshToken = refreshToken;
	}
}

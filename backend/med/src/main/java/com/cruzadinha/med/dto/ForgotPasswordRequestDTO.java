package com.cruzadinha.med.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Corpo da requisição "esqueci minha senha" ({@code POST /auth/forgot-password}).
 */
public class ForgotPasswordRequestDTO {

	@NotBlank(message = "E-mail é obrigatório")
	@Email(message = "E-mail inválido")
	private String email;

	public ForgotPasswordRequestDTO() {
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}
}

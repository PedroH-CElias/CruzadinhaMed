package com.cruzadinha.med.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Corpo da requisição de redefinição de senha ({@code POST /auth/reset-password}).
 * O código é o de 6 dígitos recebido por e-mail.
 */
public class ResetPasswordRequestDTO {

	@NotBlank(message = "E-mail é obrigatório")
	@Email(message = "E-mail inválido")
	private String email;

	@NotBlank(message = "Código é obrigatório")
	@Pattern(regexp = "\\d{6}", message = "O código deve ter 6 dígitos")
	private String code;

	@NotBlank(message = "Nova senha é obrigatória")
	@Size(min = 6, max = 72, message = "Senha deve ter entre 6 e 72 caracteres")
	private String newPassword;

	public ResetPasswordRequestDTO() {
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getNewPassword() {
		return newPassword;
	}

	public void setNewPassword(String newPassword) {
		this.newPassword = newPassword;
	}
}

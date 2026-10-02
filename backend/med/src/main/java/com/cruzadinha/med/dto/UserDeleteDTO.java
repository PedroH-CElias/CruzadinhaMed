package com.cruzadinha.med.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Corpo da requisição de exclusão de conta ({@code DELETE /users/me}).
 * A senha é pedida de novo como confirmação, para evitar exclusões acidentais
 * ou feitas por outra pessoa com o celular desbloqueado.
 */
public class UserDeleteDTO {

	@NotBlank(message = "Senha é obrigatória")
	private String password;

	public UserDeleteDTO() {
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
}

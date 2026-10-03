package com.cruzadinha.med.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corpo da edição de perfil ({@code PATCH /users/me}).
 * Regra atual: o usuário só pode alterar o NOME (e a senha, em endpoint próprio).
 */
public class UserProfileUpdateDTO {

	@NotBlank(message = "Nome é obrigatório")
	@Size(min = 3, max = 120, message = "Nome deve ter entre 3 e 120 caracteres")
	private String name;

	public UserProfileUpdateDTO() {
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}
}

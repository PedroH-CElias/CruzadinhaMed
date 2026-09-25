package com.cruzadinha.med.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserInsertDTO {

	@NotBlank(message = "Nome é obrigatório")
	@Size(min = 3, max = 120, message = "Nome deve ter entre 3 e 120 caracteres")
	private String name;

	@NotBlank(message = "E-mail é obrigatório")
	@Email(message = "E-mail inválido")
	private String email;

	@NotBlank(message = "Senha é obrigatória")
	@Size(min = 6, max = 72, message = "Senha deve ter entre 6 e 72 caracteres")
	private String password;

	public UserInsertDTO() {
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
}

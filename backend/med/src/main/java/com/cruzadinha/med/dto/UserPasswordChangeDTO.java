package com.cruzadinha.med.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserPasswordChangeDTO {

	@NotBlank(message = "Senha atual é obrigatória")
	private String currentPassword;

	@NotBlank(message = "Nova senha é obrigatória")
	@Size(min = 6, max = 72, message = "Senha deve ter entre 6 e 72 caracteres")
	private String newPassword;

	public UserPasswordChangeDTO() {
	}

	public String getCurrentPassword() {
		return currentPassword;
	}

	public void setCurrentPassword(String currentPassword) {
		this.currentPassword = currentPassword;
	}

	public String getNewPassword() {
		return newPassword;
	}

	public void setNewPassword(String newPassword) {
		this.newPassword = newPassword;
	}
}

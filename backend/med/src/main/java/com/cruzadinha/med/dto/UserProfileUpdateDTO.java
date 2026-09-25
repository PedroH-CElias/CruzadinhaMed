package com.cruzadinha.med.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserProfileUpdateDTO {

	@NotBlank
	@Size(min = 3, max = 120)
	private String name;
	@NotBlank
	private String phone;

	public UserProfileUpdateDTO() {
	}

	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
	}

	public String getPhone() {
		return phone;
	}
	
	public void setPhone(String phone) {
		this.phone = phone;
	}

}

package com.cruzadinha.med.dto;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;

import com.cruzadinha.med.entities.User;

public class UserDTO {

	private Long id;
	private String name;
	private String email;
	private String phone;
	private String cpf;

	/** Assinatura Premium ativa? É o que libera todas as cruzadinhas no app. */
	private boolean premium;

	/** Validade da assinatura em milissegundos (null se nunca assinou). */
	private Long premiumUntil;

	// Para obter apenas os nomes(Authority)
	private List<String> roles = new ArrayList<>();

	public UserDTO(User user) {
		this.id = user.getId();
		this.name = user.getName();
		this.email = user.getEmail();
		this.phone = user.getPhone();
		this.cpf = user.getCpf();
		this.premium = user.isPremium();
		this.premiumUntil = user.getPremiumUntil() != null ? user.getPremiumUntil().toEpochMilli() : null;
		for (GrantedAuthority role : user.getRoles()) {
			roles.add(role.getAuthority());
		}
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getEmail() {
		return email;
	}

	public String getPhone() {
		return phone;
	}

	public String getCpf() {
		return cpf;
	}

	public boolean isPremium() {
		return premium;
	}

	public Long getPremiumUntil() {
		return premiumUntil;
	}

	public List<String> getRoles() {
		return roles;
	}

}

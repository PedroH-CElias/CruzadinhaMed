package com.cruzadinha.med.entities;

import java.time.Instant;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Código de redefinição de senha ("esqueci minha senha").
 *
 * - O código tem 6 dígitos e é enviado por e-mail; o banco guarda só o hash dele.
 * - Vale por pouco tempo ({@link #expiresAt}) e aceita um número limitado de tentativas
 *   ({@link #attempts}), para impedir que alguém descubra o código testando combinações.
 * - Depois de usado, ou quando um código novo é pedido, fica marcado em {@link #usedAt}.
 */
@Entity
@Table(name = "tb_password_reset")
public class PasswordResetCode {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Dono do código. */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	/** Hash SHA-256 (hexadecimal) de "idDoUsuario:codigo". */
	@Column(nullable = false, length = 64)
	private String codeHash;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant expiresAt;

	/** Quantas vezes um código errado foi informado para este registro. */
	@Column(nullable = false)
	private int attempts;

	/** Preenchido quando o código foi usado com sucesso ou substituído por um novo. */
	private Instant usedAt;

	public PasswordResetCode() {
	}

	public PasswordResetCode(User user, String codeHash, Instant createdAt, Instant expiresAt) {
		this.user = user;
		this.codeHash = codeHash;
		this.createdAt = createdAt;
		this.expiresAt = expiresAt;
		this.attempts = 0;
	}

	/** Indica se o código passou da validade no instante informado. */
	public boolean isExpired(Instant now) {
		return !now.isBefore(expiresAt);
	}

	/** Registra uma tentativa com código errado. */
	public void registerFailedAttempt() {
		attempts++;
	}

	public Long getId() {
		return id;
	}

	public User getUser() {
		return user;
	}

	public String getCodeHash() {
		return codeHash;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public int getAttempts() {
		return attempts;
	}

	public Instant getUsedAt() {
		return usedAt;
	}

	public void setUsedAt(Instant usedAt) {
		this.usedAt = usedAt;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		PasswordResetCode other = (PasswordResetCode) o;
		return Objects.equals(id, other.id);
	}

	@Override
	public int hashCode() {
		return Objects.hash(id);
	}
}

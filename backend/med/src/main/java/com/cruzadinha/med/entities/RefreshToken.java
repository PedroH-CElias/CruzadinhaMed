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
 * Refresh token de uma sessão do usuário.
 *
 * O refresh token é um valor aleatório e opaco (não é JWT) entregue ao app no login.
 * O app o usa para obter um novo token de acesso quando o atual expira, sem pedir a
 * senha de novo.
 *
 * Por segurança o banco NUNCA guarda o token em si, apenas o hash SHA-256 dele
 * ({@link #tokenHash}). Assim, um vazamento do banco não permite sequestrar sessões.
 *
 * Cada token só pode ser usado uma vez (rotação): ao renovar a sessão, o token usado é
 * marcado como revogado ({@link #revokedAt}) e um novo é emitido.
 */
@Entity
@Table(name = "tb_refresh_token")
public class RefreshToken {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Hash SHA-256 (hexadecimal, 64 caracteres) do refresh token entregue ao app. */
	@Column(nullable = false, unique = true, length = 64)
	private String tokenHash;

	/** Dono da sessão. */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	/** Momento em que o token foi emitido. */
	@Column(nullable = false)
	private Instant createdAt;

	/** Momento a partir do qual o token não é mais aceito. */
	@Column(nullable = false)
	private Instant expiresAt;

	/** Preenchido quando o token é usado (rotação), no logout ou numa revogação geral. */
	private Instant revokedAt;

	public RefreshToken() {
	}

	public RefreshToken(String tokenHash, User user, Instant createdAt, Instant expiresAt) {
		this.tokenHash = tokenHash;
		this.user = user;
		this.createdAt = createdAt;
		this.expiresAt = expiresAt;
	}

	/** Indica se o token já foi usado ou invalidado. */
	public boolean isRevoked() {
		return revokedAt != null;
	}

	/** Indica se o token passou da data de validade no instante informado. */
	public boolean isExpired(Instant now) {
		return !now.isBefore(expiresAt);
	}

	public Long getId() {
		return id;
	}

	public String getTokenHash() {
		return tokenHash;
	}

	public User getUser() {
		return user;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getRevokedAt() {
		return revokedAt;
	}

	public void setRevokedAt(Instant revokedAt) {
		this.revokedAt = revokedAt;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		RefreshToken other = (RefreshToken) o;
		return Objects.equals(id, other.id);
	}

	@Override
	public int hashCode() {
		return Objects.hash(id);
	}
}

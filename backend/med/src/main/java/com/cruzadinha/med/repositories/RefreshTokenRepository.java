package com.cruzadinha.med.repositories;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cruzadinha.med.entities.RefreshToken;

/**
 * Acesso aos refresh tokens (sessões) dos usuários.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

	/**
	 * Busca uma sessão pelo hash do token. Já traz o usuário e os perfis dele
	 * na mesma consulta, porque eles são necessários para emitir o novo token de acesso.
	 */
	@Query("SELECT r FROM RefreshToken r JOIN FETCH r.user u LEFT JOIN FETCH u.roles WHERE r.tokenHash = :tokenHash")
	Optional<RefreshToken> findByTokenHash(@Param("tokenHash") String tokenHash);

	/**
	 * Revoga todas as sessões ainda ativas de um usuário (ex.: quando detectamos que um
	 * refresh token já usado foi apresentado de novo, sinal de que ele foi roubado).
	 *
	 * @return quantidade de sessões revogadas
	 */
	@Modifying
	@Query("UPDATE RefreshToken r SET r.revokedAt = :now WHERE r.user.id = :userId AND r.revokedAt IS NULL")
	int revokeAllActiveByUser(@Param("userId") Long userId, @Param("now") Instant now);
}

package com.cruzadinha.med.repositories;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cruzadinha.med.entities.PasswordResetCode;

/**
 * Acesso aos códigos de redefinição de senha.
 */
@Repository
public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {

	/** Código mais recente ainda não usado do usuário (é o único válido). */
	Optional<PasswordResetCode> findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(Long userId);

	/** Invalida todos os códigos pendentes do usuário (ao gerar um novo ou ao redefinir a senha). */
	@Modifying
	@Query("UPDATE PasswordResetCode p SET p.usedAt = :now WHERE p.user.id = :userId AND p.usedAt IS NULL")
	int invalidateAllActiveByUser(@Param("userId") Long userId, @Param("now") Instant now);

	/** Apaga todos os códigos do usuário (usado na exclusão de conta). */
	@Modifying
	@Query("DELETE FROM PasswordResetCode p WHERE p.user.id = :userId")
	int deleteAllByUser(@Param("userId") Long userId);
}

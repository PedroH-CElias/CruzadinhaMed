package com.cruzadinha.med.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cruzadinha.med.entities.PuzzleProgress;

/**
 * Acesso ao progresso dos usuários nas cruzadinhas.
 */
@Repository
public interface PuzzleProgressRepository extends JpaRepository<PuzzleProgress, Long> {

	/** Todo o progresso de um usuário (no máximo uma linha por cruzadinha). */
	List<PuzzleProgress> findAllByUserId(Long userId);

	/** Apaga todo o progresso do usuário (usado na exclusão de conta). */
	@Modifying
	@Query("DELETE FROM PuzzleProgress p WHERE p.user.id = :userId")
	int deleteAllByUser(@Param("userId") Long userId);
}

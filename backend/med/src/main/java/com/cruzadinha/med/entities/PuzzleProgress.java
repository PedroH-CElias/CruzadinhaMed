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
import jakarta.persistence.UniqueConstraint;

/**
 * Progresso de um usuário numa cruzadinha.
 *
 * As cruzadinhas ficam no app (frontend, arquivo puzzles.js); aqui guardamos apenas o
 * progresso, identificado pelo id da cruzadinha (ex.: "anatomia-facil-1").
 * Existe no máximo um registro por usuário e cruzadinha.
 *
 * Regras de junção quando o mesmo progresso chega de aparelhos diferentes
 * (implementadas no {@code ProgressService}):
 * - letras, palavras certas e dicas: vale a versão mais recente ({@link #updatedAt});
 * - concluída: uma vez concluída, continua concluída (vale a primeira data de conclusão).
 */
@Entity
@Table(name = "tb_puzzle_progress",
		uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "puzzle_id" }))
public class PuzzleProgress {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Dono do progresso. */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	/** Id da cruzadinha no app (ex.: "anatomia-facil-1"). */
	@Column(name = "puzzle_id", nullable = false, length = 64)
	private String puzzleId;

	/**
	 * Letras preenchidas, em JSON gerado pelo app (ex.: {"0-10":"U","1-10":"N"}).
	 * O backend guarda o texto como veio, sem interpretar.
	 */
	@Column(nullable = false, length = 4000)
	private String cells;

	/** Quantas palavras estão certas. */
	@Column(nullable = false)
	private int solvedWords;

	/** Total de palavras da cruzadinha. */
	@Column(nullable = false)
	private int totalWords;

	/** Quantas dicas foram usadas. */
	@Column(nullable = false)
	private int hintsUsed;

	/** Se a cruzadinha já foi concluída alguma vez (não volta a false). */
	@Column(nullable = false)
	private boolean completed;

	/** Primeira vez em que foi concluída. */
	private Instant completedAt;

	/** Momento da última alteração feita no app (usado para escolher a versão mais recente). */
	@Column(nullable = false)
	private Instant updatedAt;

	public PuzzleProgress() {
	}

	public PuzzleProgress(User user, String puzzleId) {
		this.user = user;
		this.puzzleId = puzzleId;
	}

	public Long getId() {
		return id;
	}

	public User getUser() {
		return user;
	}

	public String getPuzzleId() {
		return puzzleId;
	}

	public String getCells() {
		return cells;
	}

	public void setCells(String cells) {
		this.cells = cells;
	}

	public int getSolvedWords() {
		return solvedWords;
	}

	public void setSolvedWords(int solvedWords) {
		this.solvedWords = solvedWords;
	}

	public int getTotalWords() {
		return totalWords;
	}

	public void setTotalWords(int totalWords) {
		this.totalWords = totalWords;
	}

	public int getHintsUsed() {
		return hintsUsed;
	}

	public void setHintsUsed(int hintsUsed) {
		this.hintsUsed = hintsUsed;
	}

	public boolean isCompleted() {
		return completed;
	}

	public void setCompleted(boolean completed) {
		this.completed = completed;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(Instant completedAt) {
		this.completedAt = completedAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		PuzzleProgress other = (PuzzleProgress) o;
		return Objects.equals(id, other.id);
	}

	@Override
	public int hashCode() {
		return Objects.hash(id);
	}
}

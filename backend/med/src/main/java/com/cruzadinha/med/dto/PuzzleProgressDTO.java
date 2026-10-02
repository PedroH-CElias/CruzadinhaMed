package com.cruzadinha.med.dto;

import com.cruzadinha.med.entities.PuzzleProgress;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Progresso de uma cruzadinha, no formato trocado com o app (envio e resposta).
 *
 * As datas são números em milissegundos desde 1970 (o mesmo que Date.now() no JavaScript),
 * para evitar qualquer problema de formato ou fuso horário.
 */
public class PuzzleProgressDTO {

	@NotBlank(message = "Id da cruzadinha é obrigatório")
	@Pattern(regexp = "[a-z0-9-]{1,64}", message = "Id da cruzadinha inválido")
	private String puzzleId;

	/** Letras preenchidas, em JSON gerado pelo app. */
	@NotNull(message = "Células são obrigatórias")
	@Size(max = 4000, message = "Progresso grande demais")
	private String cells;

	@Min(0)
	@Max(500)
	private int solvedWords;

	@Min(0)
	@Max(500)
	private int totalWords;

	@Min(0)
	@Max(10000)
	private int hintsUsed;

	private boolean completed;

	/** Primeira conclusão, em milissegundos (null se nunca foi concluída). */
	private Long completedAt;

	/** Última alteração no app, em milissegundos. */
	@NotNull(message = "Data de atualização é obrigatória")
	private Long updatedAt;

	public PuzzleProgressDTO() {
	}

	/** Monta o DTO de resposta a partir do registro salvo. */
	public PuzzleProgressDTO(PuzzleProgress entity) {
		this.puzzleId = entity.getPuzzleId();
		this.cells = entity.getCells();
		this.solvedWords = entity.getSolvedWords();
		this.totalWords = entity.getTotalWords();
		this.hintsUsed = entity.getHintsUsed();
		this.completed = entity.isCompleted();
		this.completedAt = entity.getCompletedAt() != null ? entity.getCompletedAt().toEpochMilli() : null;
		this.updatedAt = entity.getUpdatedAt().toEpochMilli();
	}

	public String getPuzzleId() {
		return puzzleId;
	}

	public void setPuzzleId(String puzzleId) {
		this.puzzleId = puzzleId;
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

	public Long getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(Long completedAt) {
		this.completedAt = completedAt;
	}

	public Long getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Long updatedAt) {
		this.updatedAt = updatedAt;
	}
}

package com.cruzadinha.med.dto;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Lote de progresso enviado pelo app em {@code PUT /progress}.
 * Pode trazer uma ou várias cruzadinhas (ex.: tudo que ficou pendente enquanto estava offline).
 */
public class ProgressSyncRequestDTO {

	@NotNull(message = "Lista de progresso é obrigatória")
	@Size(max = 200, message = "Envie no máximo 200 cruzadinhas por vez")
	@Valid
	private List<PuzzleProgressDTO> items = new ArrayList<>();

	public ProgressSyncRequestDTO() {
	}

	public List<PuzzleProgressDTO> getItems() {
		return items;
	}

	public void setItems(List<PuzzleProgressDTO> items) {
		this.items = items;
	}
}

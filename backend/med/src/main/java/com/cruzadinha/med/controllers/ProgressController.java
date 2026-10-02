package com.cruzadinha.med.controllers;

import static com.cruzadinha.med.utils.AuthorizationUtils.HAS_ANY_ROLE_ALL;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cruzadinha.med.dto.ProgressSyncRequestDTO;
import com.cruzadinha.med.dto.PuzzleProgressDTO;
import com.cruzadinha.med.services.ProgressService;

import jakarta.validation.Valid;

/**
 * Progresso do usuário logado nas cruzadinhas (exige token de acesso).
 *
 * <pre>
 * GET /progress  -> 200 [PuzzleProgressDTO...]
 * PUT /progress  {"items":[PuzzleProgressDTO...]} -> 200 [PuzzleProgressDTO...] (lista completa após juntar)
 * </pre>
 */
@RestController
@RequestMapping(value = "/progress")
public class ProgressController {

	@Autowired
	private ProgressService service;

	/** Devolve todo o progresso do usuário logado. */
	@PreAuthorize(HAS_ANY_ROLE_ALL)
	@GetMapping
	public ResponseEntity<List<PuzzleProgressDTO>> findAll() {
		return ResponseEntity.ok(service.findAll());
	}

	/** Recebe um lote de progresso do app, junta com o salvo e devolve a lista completa. */
	@PreAuthorize(HAS_ANY_ROLE_ALL)
	@PutMapping
	public ResponseEntity<List<PuzzleProgressDTO>> sync(@Valid @RequestBody ProgressSyncRequestDTO dto) {
		return ResponseEntity.ok(service.sync(dto));
	}
}

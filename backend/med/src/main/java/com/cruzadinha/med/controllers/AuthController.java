package com.cruzadinha.med.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cruzadinha.med.dto.LoginRequestDTO;
import com.cruzadinha.med.dto.RefreshRequestDTO;
import com.cruzadinha.med.dto.TokenResponseDTO;
import com.cruzadinha.med.services.AuthService;

import jakarta.validation.Valid;

/**
 * Endpoints públicos de autenticação (não exigem token de acesso).
 *
 * <pre>
 * POST /auth/login    {"email","password"}  -> 200 TokenResponseDTO | 401
 * POST /auth/refresh  {"refreshToken"}      -> 200 TokenResponseDTO | 401
 * POST /auth/logout   {"refreshToken"}      -> 204
 * </pre>
 */
@RestController
@RequestMapping(value = "/auth")
public class AuthController {

	@Autowired
	private AuthService service;

	/** Faz login com e-mail e senha e devolve o par de tokens da nova sessão. */
	@PostMapping(value = "/login")
	public ResponseEntity<TokenResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
		return ResponseEntity.ok(service.login(dto));
	}

	/** Renova a sessão: troca o refresh token atual por um novo par de tokens. */
	@PostMapping(value = "/refresh")
	public ResponseEntity<TokenResponseDTO> refresh(@Valid @RequestBody RefreshRequestDTO dto) {
		return ResponseEntity.ok(service.refresh(dto));
	}

	/** Encerra a sessão revogando o refresh token. */
	@PostMapping(value = "/logout")
	public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequestDTO dto) {
		service.logout(dto);
		return ResponseEntity.noContent().build();
	}
}

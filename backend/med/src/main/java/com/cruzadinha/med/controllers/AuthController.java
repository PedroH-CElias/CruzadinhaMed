package com.cruzadinha.med.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cruzadinha.med.dto.ForgotPasswordRequestDTO;
import com.cruzadinha.med.dto.LoginRequestDTO;
import com.cruzadinha.med.dto.RefreshRequestDTO;
import com.cruzadinha.med.dto.ResetPasswordRequestDTO;
import com.cruzadinha.med.dto.TokenResponseDTO;
import com.cruzadinha.med.services.AuthService;
import com.cruzadinha.med.services.PasswordResetService;

import jakarta.validation.Valid;

/**
 * Endpoints públicos de autenticação (não exigem token de acesso).
 *
 * <pre>
 * POST /auth/login    {"email","password"}  -> 200 TokenResponseDTO | 401
 * POST /auth/refresh  {"refreshToken"}      -> 200 TokenResponseDTO | 401
 * POST /auth/logout   {"refreshToken"}      -> 204
 * POST /auth/forgot-password {"email"}      -> 204 (sempre, exista ou não a conta)
 * POST /auth/reset-password  {"email","code","newPassword"} -> 204 | 422
 * </pre>
 *
 * Login, esqueci minha senha e redefinição têm limite de requisições por IP
 * (ver {@code RateLimitFilter}): acima do limite a resposta é 429.
 */
@RestController
@RequestMapping(value = "/auth")
public class AuthController {

	@Autowired
	private AuthService service;

	@Autowired
	private PasswordResetService passwordResetService;

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

	/** Envia um código de redefinição de senha por e-mail, se a conta existir. */
	@PostMapping(value = "/forgot-password")
	public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO dto) {
		passwordResetService.requestReset(dto);
		return ResponseEntity.noContent().build();
	}

	/** Troca a senha usando o código recebido por e-mail. Encerra todas as sessões abertas. */
	@PostMapping(value = "/reset-password")
	public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO dto) {
		passwordResetService.resetPassword(dto);
		return ResponseEntity.noContent().build();
	}
}

package com.cruzadinha.med.controllers;

import static com.cruzadinha.med.utils.AuthorizationUtils.HAS_ANY_ROLE_ADMIM;
import static com.cruzadinha.med.utils.AuthorizationUtils.HAS_ANY_ROLE_ALL;

import java.net.URI;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.cruzadinha.med.dto.UserDTO;
import com.cruzadinha.med.dto.UserDeleteDTO;
import com.cruzadinha.med.dto.UserInsertDTO;
import com.cruzadinha.med.dto.UserPasswordChangeDTO;
import com.cruzadinha.med.dto.UserProfileUpdateDTO;
import com.cruzadinha.med.services.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping(value = "/users")
public class UserController {

	@Autowired
	private UserService service;

	/*
	 * Cadastro de usuário.
	 * REGRA DE NEGÓCIO: só assinantes Premium têm conta. Enquanto a compra da assinatura
	 * não existir, o cadastro fica FECHADO ao público: apenas um ADMIN consegue criar contas.
	 * Quando o fluxo de compra existir, a conta passará a ser criada junto com a assinatura.
	 */
	@PreAuthorize(HAS_ANY_ROLE_ADMIM)
	@PostMapping
	public ResponseEntity<UserDTO> insert(@Valid @RequestBody UserInsertDTO dto) {
		UserDTO userDto = service.insert(dto);
		URI uri = ServletUriComponentsBuilder.fromCurrentContextPath().path("/users/me").build().toUri();
		return ResponseEntity.created(uri).body(userDto);
	}

	// Busca o Usuário Logado
	@PreAuthorize(HAS_ANY_ROLE_ALL)
	@GetMapping(value = "/me") // endPoint da request
	public ResponseEntity<UserDTO> getMe() {
		UserDTO dto = service.getMe();
		return ResponseEntity.ok(dto);
	}
	
	@PreAuthorize(HAS_ANY_ROLE_ALL)
	@PatchMapping(value = "/me")
	public ResponseEntity<UserDTO> update(@Valid @RequestBody UserProfileUpdateDTO dto) {
		UserDTO userDto = service.update(dto);
		return ResponseEntity.ok(userDto);
	}
	
	// Exclui definitivamente a conta do usuário logado (pede a senha como confirmação)
	@PreAuthorize(HAS_ANY_ROLE_ALL)
	@DeleteMapping(value = "/me")
	public ResponseEntity<Void> deleteMe(@Valid @RequestBody UserDeleteDTO dto) {
		service.deleteMe(dto);
		return ResponseEntity.noContent().build();
	}

	@PreAuthorize(HAS_ANY_ROLE_ALL)
	@PatchMapping(value = "/me/password")
	public ResponseEntity<Void> changePassword(@Valid @RequestBody UserPasswordChangeDTO dto) {
		service.changePassword(dto);
		return ResponseEntity.noContent().build();
	}
}

package com.cruzadinha.med.controllers;

import static com.cruzadinha.med.utils.AuthorizationUtils.HAS_ANY_ROLE_ALL;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cruzadinha.med.dto.UserDTO;
import com.cruzadinha.med.dto.UserPasswordChangeDTO;
import com.cruzadinha.med.dto.UserProfileUpdateDTO;
import com.cruzadinha.med.services.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping(value = "/users")
public class UserController {

	@Autowired
	private UserService service;

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
	
	@PreAuthorize(HAS_ANY_ROLE_ALL)
	@PatchMapping(value = "/me/password")
	public ResponseEntity<Void> changePassword(@Valid @RequestBody UserPasswordChangeDTO dto) {
		service.changePassword(dto);
		return ResponseEntity.noContent().build();
	}
}

package com.cruzadinha.med.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cruzadinha.med.dto.UserDTO;
import com.cruzadinha.med.dto.UserDeleteDTO;
import com.cruzadinha.med.dto.UserInsertDTO;
import com.cruzadinha.med.dto.UserPasswordChangeDTO;
import com.cruzadinha.med.dto.UserProfileUpdateDTO;
import com.cruzadinha.med.entities.Role;
import com.cruzadinha.med.entities.User;
import com.cruzadinha.med.projections.UserDetailsProjection;
import com.cruzadinha.med.repositories.PasswordResetCodeRepository;
import com.cruzadinha.med.repositories.RefreshTokenRepository;
import com.cruzadinha.med.repositories.RoleRepository;
import com.cruzadinha.med.repositories.UserRepository;


@Service
public class UserService implements UserDetailsService {

	@Autowired
	private UserRepository repository;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Autowired
	private PasswordResetCodeRepository passwordResetCodeRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	private static final String DEFAULT_ROLE = "ROLE_PLAYER";

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		List<UserDetailsProjection> result = repository.searchUserAndRolesByEmail(username);
		if (result.isEmpty()) {
			throw newUsernameNotFoundException();
		}

		/**
		 * Instancia um novo User Atribuiu o username passado por parametro ao email.
		 * Como é somente um usuário com esse username, pega o get(0) e associa a senha
		 * buscada do bd ao password do user. Percorre a lista, que pode possuir mais de
		 * um dado devido ao usuario ter mais de um perfil (Ex: ADM e CLIENT) E no loop
		 * cria um novo Role (Perfil/Função do Usuário) adicionado o Id que buscou da
		 * tabela de Role e o tipo de Autorização que o usuário possui no sistema (Ex:
		 * ADM e CLIENT), associando esses dados ao User criado.
		 */
		User user = new User();
		user.setEmail(username);
		user.setPassword(result.get(0).getPassword());
		for (UserDetailsProjection projection : result) {
			Role role = new Role(projection.getRoleId(), projection.getAuthority());
			user.addRole(role);
		}

		return user;
	}

	// Criado para retornar o usuário logado, caso contrário, ex.
	protected User authenticated() {
		// Pega um objeto caso tiver no contexto do springSecurity
		try {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			Jwt jwtPrincipal = (Jwt) authentication.getPrincipal();
			String username = jwtPrincipal.getClaim("username"); // Configurados no AuthServerConfig

			return repository.findByEmail(username).get();
		} catch (Exception e) {
			throw newUsernameNotFoundException();
		}
	}

	// Busca o Usuário Logado
	@Transactional(readOnly = true)
	public UserDTO getMe() {
		User user = authenticated();
		return new UserDTO(user);
	}

	private UsernameNotFoundException newUsernameNotFoundException() {
		return new UsernameNotFoundException("User not found");
	}

	// Cadastro público de novo jogador
	@Transactional
	public UserDTO insert(UserInsertDTO dto) {
		String email = dto.getEmail().trim().toLowerCase();
		if (repository.findByEmail(email).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
		}

		Role role = roleRepository.findByAuthority(DEFAULT_ROLE)
				.orElseThrow(() -> new IllegalStateException("Perfil " + DEFAULT_ROLE + " não encontrado no banco"));

		User user = new User();
		user.setName(dto.getName().trim());
		user.setEmail(email);
		user.setPassword(encryptPassword(dto.getPassword()));
		user.addRole(role);

		user = save(user);
		return new UserDTO(user);
	}

	/**
	 * Exclui definitivamente a conta do usuário logado (exigência da Apple e do Google Play,
	 * e direito do titular pela LGPD).
	 *
	 * A senha é pedida de novo como confirmação. Senha errada responde 422, e não 401,
	 * para o app não confundir com sessão expirada.
	 *
	 * Ordem da exclusão: sessões e códigos de redefinição primeiro (dependem do usuário),
	 * depois o usuário. Os vínculos em tb_user_role são removidos junto com ele pelo JPA.
	 * Quando existirem outros dados ligados ao usuário (ex.: progresso no jogo), eles
	 * também precisam ser apagados aqui.
	 */
	@Transactional
	public void deleteMe(UserDeleteDTO dto) {
		User user = authenticated();

		if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
			throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Senha incorreta");
		}

		refreshTokenRepository.deleteAllByUser(user.getId());
		passwordResetCodeRepository.deleteAllByUser(user.getId());
		repository.delete(user);
	}

	@Transactional
	public UserDTO update(UserProfileUpdateDTO dto) {
		User user = authenticated();
		copyUserProfileDtoToEntity(dto, user);
		user = save(user);
		return new UserDTO(user);
	}

	private void copyUserProfileDtoToEntity(UserProfileUpdateDTO dto, User user) {
		user.setName(dto.getName());
		user.setPhone(dto.getPhone());
	}

	private User save(User user) {
		return repository.save(user);
	}

	@Transactional
	public void changePassword(UserPasswordChangeDTO dto) {
		User user = authenticated();
		applyPasswordChange(dto, user);
	}

	private void applyPasswordChange(UserPasswordChangeDTO dto, User user) {
		final String currentPassword = dto.getCurrentPassword();
		final String newPassword = dto.getNewPassword();

		if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
			throw new BadCredentialsException("Senha atual incorreta");
		}

		user.setPassword(encryptPassword(newPassword));
		save(user);
	}

	private String encryptPassword(final String newPassword) {
		return passwordEncoder.encode(newPassword);
	}
}

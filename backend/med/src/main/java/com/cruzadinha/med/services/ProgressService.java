package com.cruzadinha.med.services;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cruzadinha.med.dto.ProgressSyncRequestDTO;
import com.cruzadinha.med.dto.PuzzleProgressDTO;
import com.cruzadinha.med.entities.PuzzleProgress;
import com.cruzadinha.med.entities.User;
import com.cruzadinha.med.repositories.PuzzleProgressRepository;

/**
 * Progresso do usuário logado nas cruzadinhas.
 *
 * O app guarda o progresso primeiro no aparelho e envia para cá quando há conexão.
 * Como o mesmo usuário pode jogar em mais de um aparelho, cada envio é JUNTADO com o
 * que já está salvo (ver {@link #merge}), em vez de simplesmente sobrescrever.
 *
 * ATENÇÃO: o backend confia no que o app informa (não confere as respostas, porque as
 * cruzadinhas ficam no app). Se um dia houver ranking ou prêmios, a conferência das
 * respostas precisa passar a ser feita aqui no servidor.
 */
@Service
public class ProgressService {

	/**
	 * Tolerância para relógios de celular adiantados. Datas mais de 5 minutos no futuro
	 * são trazidas para "agora", senão um aparelho com relógio errado travaria o registro.
	 */
	private static final Duration MAX_CLOCK_SKEW = Duration.ofMinutes(5);

	@Autowired
	private PuzzleProgressRepository repository;

	@Autowired
	private UserService userService;

	/** Todo o progresso do usuário logado. */
	@Transactional(readOnly = true)
	public List<PuzzleProgressDTO> findAll() {
		User user = userService.authenticated();
		return toDtos(repository.findAllByUserId(user.getId()));
	}

	/**
	 * Junta o lote enviado pelo app com o progresso salvo e devolve o resultado completo
	 * (todas as cruzadinhas do usuário), para o app atualizar a cópia local.
	 */
	@Transactional
	public List<PuzzleProgressDTO> sync(ProgressSyncRequestDTO dto) {
		User user = userService.authenticated();
		Instant maxAllowed = Instant.now().plus(MAX_CLOCK_SKEW);

		Map<String, PuzzleProgress> stored = new HashMap<>();
		for (PuzzleProgress progress : repository.findAllByUserId(user.getId())) {
			stored.put(progress.getPuzzleId(), progress);
		}

		for (PuzzleProgressDTO item : dto.getItems()) {
			PuzzleProgress current = stored.computeIfAbsent(item.getPuzzleId(), id -> new PuzzleProgress(user, id));
			merge(current, item, maxAllowed);
			repository.save(current);
		}

		return toDtos(stored.values());
	}

	/**
	 * Regras de junção:
	 * - letras, palavras certas, total e dicas: só são substituídos se o envio for MAIS
	 *   RECENTE que o salvo (comparando updatedAt);
	 * - concluída: se o envio diz que foi concluída, fica concluída para sempre, com a
	 *   data de conclusão mais antiga entre as duas versões.
	 */
	private static void merge(PuzzleProgress current, PuzzleProgressDTO item, Instant maxAllowed) {
		Instant incomingUpdatedAt = clamp(Instant.ofEpochMilli(item.getUpdatedAt()), maxAllowed);

		boolean incomingIsNewer = current.getUpdatedAt() == null || incomingUpdatedAt.isAfter(current.getUpdatedAt());
		if (incomingIsNewer) {
			current.setCells(item.getCells());
			current.setSolvedWords(item.getSolvedWords());
			current.setTotalWords(item.getTotalWords());
			current.setHintsUsed(item.getHintsUsed());
			current.setUpdatedAt(incomingUpdatedAt);
		}

		if (item.isCompleted()) {
			Instant incomingCompletedAt = item.getCompletedAt() != null
					? clamp(Instant.ofEpochMilli(item.getCompletedAt()), maxAllowed)
					: incomingUpdatedAt;
			if (!current.isCompleted() || current.getCompletedAt() == null
					|| incomingCompletedAt.isBefore(current.getCompletedAt())) {
				current.setCompleted(true);
				current.setCompletedAt(incomingCompletedAt);
			}
		}
	}

	/** Limita uma data ao máximo permitido (protege contra relógios adiantados). */
	private static Instant clamp(Instant value, Instant max) {
		return value.isAfter(max) ? max : value;
	}

	private static List<PuzzleProgressDTO> toDtos(Iterable<PuzzleProgress> list) {
		List<PuzzleProgressDTO> result = new ArrayList<>();
		list.forEach(p -> result.add(new PuzzleProgressDTO(p)));
		result.sort(Comparator.comparing(PuzzleProgressDTO::getPuzzleId));
		return result;
	}
}

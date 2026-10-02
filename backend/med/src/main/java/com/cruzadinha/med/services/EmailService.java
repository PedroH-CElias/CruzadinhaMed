package com.cruzadinha.med.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Envio de e-mails do app.
 *
 * O envio real só acontece quando o SMTP está configurado (propriedade {@code spring.mail.host}).
 * Sem SMTP, o Spring Boot não cria o {@link JavaMailSender} e este serviço:
 * - com {@code app.mail.log-codes=true} (perfil test): escreve o código no console, para testes;
 * - caso contrário: registra um erro SEM o código, para não vazar códigos em produção.
 */
@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	/** Disponível apenas quando o SMTP está configurado. */
	private final ObjectProvider<JavaMailSender> mailSender;

	/** Remetente dos e-mails (ex.: "CruzadinhaMed <nao-responda@seudominio.com>"). */
	@Value("${app.mail.from}")
	private String from;

	/** Se true e não houver SMTP, mostra o código no console (somente desenvolvimento). */
	@Value("${app.mail.log-codes:false}")
	private boolean logCodes;

	public EmailService(ObjectProvider<JavaMailSender> mailSender) {
		this.mailSender = mailSender;
	}

	/**
	 * Envia o código de redefinição de senha.
	 *
	 * @param to            e-mail do usuário
	 * @param name          nome do usuário (para a saudação)
	 * @param code          código de 6 dígitos
	 * @param validMinutes  validade do código, em minutos
	 */
	public void sendPasswordResetCode(String to, String name, String code, long validMinutes) {
		JavaMailSender sender = mailSender.getIfAvailable();

		if (sender == null) {
			if (logCodes) {
				log.info("[DEV] SMTP não configurado. Código de redefinição para {}: {}", to, code);
			} else {
				log.error("SMTP não configurado: não foi possível enviar o código de redefinição para {}", to);
			}
			return;
		}

		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(from);
		message.setTo(to);
		message.setSubject("Seu código para redefinir a senha - CruzadinhaMed");
		message.setText("""
				Olá, %s!

				Seu código para redefinir a senha do CruzadinhaMed é:

				%s

				Ele vale por %d minutos. Se você não pediu a redefinição, ignore este e-mail;
				sua senha continua a mesma.
				""".formatted(name, code, validMinutes));

		try {
			sender.send(message);
		} catch (MailException e) {
			// Não repassa o erro ao app: a resposta de "esqueci minha senha" é sempre a mesma
			log.error("Falha ao enviar e-mail de redefinição para {}", to, e);
		}
	}
}

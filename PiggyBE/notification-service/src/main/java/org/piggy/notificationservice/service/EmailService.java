package org.piggy.notificationservice.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendHtmlEmail(String recipientEmail, String subject, String templateCode, Map<String, Object> params) {
        try {
            Context context = new Context();
            if (params != null) {
                context.setVariables(params);
            }

            // Render HTML content from Thymeleaf template
            String htmlContent = templateEngine.process(templateCode, context);

            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setFrom(senderEmail);
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true indicates HTML

            javaMailSender.send(mimeMessage);
            log.info("Email sent successfully to {}", recipientEmail);

        } catch (MessagingException e) {
            log.error("Failed to send email to {}", recipientEmail, e);
        } catch (Exception e) {
            log.error("Error occurred while processing email template: {}", templateCode, e);
        }
    }
}

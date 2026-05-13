package org.piggy.notificationservice.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.piggy.common.event.NotificationEvent;
import org.piggy.notificationservice.config.RabbitMQConfig;
import org.piggy.notificationservice.service.EmailService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final EmailService emailService;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void consumeMessage(NotificationEvent event) {
        log.info("Received notification event -> {}", event);

        // Call the email service to handle the sending of the email
        emailService.sendHtmlEmail(
                event.getRecipientEmail(),
                event.getSubject(),
                event.getTemplateCode(),
                event.getParams()
        );
    }
}

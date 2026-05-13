package org.piggy.transactionservice.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.piggy.transactionservice.dtos.request.TransactionRequest;
import org.piggy.transactionservice.entity.RecurringTransaction;
import org.piggy.transactionservice.repository.RecurringTransactionRepository;
import org.piggy.transactionservice.services.ITransactionService;
import org.piggy.common.event.NotificationEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringTransactionScheduler {

    private final RecurringTransactionRepository recurringTransactionRepository;
    private final ITransactionService transactionService;
    private final RabbitTemplate rabbitTemplate;



    // Chạy vào 00:01:00 mỗi ngày
    @Scheduled(cron = "0 35 18 * * ?")
    @Transactional
    public void processRecurringTransactions() {
        log.info("Bắt đầu xử lý các giao dịch định kỳ cho ngày: {}", LocalDate.now());
        
        List<RecurringTransaction> dueTransactions = recurringTransactionRepository
                .findByActiveTrueAndNextExecutionDateLessThanEqual(LocalDate.now());

        for (RecurringTransaction rt : dueTransactions) {
            try {
                // Tạo giao dịch thực tế
                TransactionRequest transactionRequest = new TransactionRequest();
                transactionRequest.setWalletId(rt.getWalletId());
                transactionRequest.setCategoryId(rt.getCategoryId());
                transactionRequest.setAmount(rt.getAmount());
                transactionRequest.setNote("Giao dịch tự động: " + rt.getName());
                transactionRequest.setTransactionDate(LocalDateTime.now());

                transactionService.createTransaction(rt.getUserId(), transactionRequest);
                
                // Tính toán ngày thực thi tiếp theo
                LocalDate nextDate = rt.getNextExecutionDate();
                switch (rt.getFrequency()) {
                    case DAILY:
                        nextDate = nextDate.plusDays(1);
                        break;
                    case WEEKLY:
                        nextDate = nextDate.plusWeeks(1);
                        break;
                    case MONTHLY:
                        nextDate = nextDate.plusMonths(1);
                        break;
                    case YEARLY:
                        nextDate = nextDate.plusYears(1);
                        break;
                }
                
                rt.setNextExecutionDate(nextDate);
                recurringTransactionRepository.save(rt);
                
                // Fetch User Email and Send Notification Event
                try {
                    Map<String, Object> params = new HashMap<>();
                    params.put("name", "User"); // You can still fetch from identity if needed, but we don't need to block on it, or we could just use email/id
                    params.put("transactionName", rt.getName());
                    params.put("amount", rt.getAmount());
                    params.put("date", LocalDate.now().toString());

                    NotificationEvent event = NotificationEvent.builder()
                            .recipientEmail(rt.getEmail())
                            .subject("Recurring Transaction Successful")
                            .templateCode("RECURRING_SUCCESS")
                            .params(params)
                            .build();

                    rabbitTemplate.convertAndSend("notification.exchange", "notification.routing.key", event);
                } catch (Exception ex) {
                    log.error("Failed to send recurring success email: {}", ex.getMessage());
                }
                
                log.info("Xử lý thành công giao dịch định kỳ ID: {}, Ngày kế tiếp: {}", rt.getId(), nextDate);
            } catch (Exception e) {
                log.error("Lỗi khi xử lý giao dịch định kỳ ID: {} - Lỗi: {}", rt.getId(), e.getMessage());

                // Không throw exception để các giao dịch sau vẫn được chạy
            }
        }
        
        log.info("Hoàn thành xử lý giao dịch định kỳ.");
    }
}

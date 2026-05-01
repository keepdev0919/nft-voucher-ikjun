package com.ssafy.ttocket.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class NotificationManager {
    @Autowired
    private MatterMostSender mmSender;

    public void sendNotification(Exception e, String uri, String params) {
        log.info("#### SEND Notification");
        mmSender.sendMessage(e, uri, params);
    }
}

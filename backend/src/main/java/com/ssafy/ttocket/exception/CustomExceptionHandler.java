package com.ssafy.ttocket.exception;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.QueryTimeoutException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.Enumeration;

@ControllerAdvice
public class CustomExceptionHandler extends ResponseEntityExceptionHandler {
    @Autowired
    private NotificationManager notificationManager;

    @ExceptionHandler(QueryTimeoutException.class)
    public ResponseEntity<Object> handleQueryTimeoutException(QueryTimeoutException ex, HttpServletRequest request) {
        String errorMessage = "Redis query timed out";

        notificationManager.sendNotification(ex, request.getRequestURI(), getParams(request));
        ErrorDetails errorDetails = new ErrorDetails(new Date(), errorMessage);
        return new ResponseEntity<>(errorDetails, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    private String getParams(HttpServletRequest req) {
        StringBuilder params = new StringBuilder();
        Enumeration<String> keys = req.getParameterNames();
        while (keys.hasMoreElements()) {
            String key = keys.nextElement();
            params.append("- ").append(key).append(" : ").append(req.getParameter(key)).append("/n");
        }

        return params.toString();
    }

    @Data
    class ErrorDetails{
        Date date;
        String msg;

        public ErrorDetails(Date date, String msg) {
            this.date = date;
            this.msg = msg;
        }
    }
}
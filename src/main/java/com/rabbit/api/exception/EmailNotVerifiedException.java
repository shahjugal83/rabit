package com.rabbit.api.exception;

public class EmailNotVerifiedException extends RuntimeException {
    
    public EmailNotVerifiedException(String message) {
        super(message);
    }
}

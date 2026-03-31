package com.cqie.admin.common.exception;

import lombok.Data;

public class ClientException extends RuntimeException{
    public final String errorCode;

    public final String errorMessage;


    public ClientException(String errorCode, String errorMessage) {
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }
}

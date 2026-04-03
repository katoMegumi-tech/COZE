package com.cqie.admin.common.exception;

public class ClientException extends RuntimeException {
    public final String errorCode;

    public final String errorMessage;

    public ClientException(String errorCode, String errorMessage) {
        super(errorMessage);  // 调用父类构造函数设置 message
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }
}

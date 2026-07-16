package com.rabit.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class DashboardController {

    @GetMapping("/dashboard")
    public ResponseEntity<Void> getDashboard() {
        return ResponseEntity.ok().build();
    }
}

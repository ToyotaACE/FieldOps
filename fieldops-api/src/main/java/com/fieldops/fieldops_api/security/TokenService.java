package com.fieldops.fieldops_api.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;

import com.fieldops.fieldops_api.entities.User;

@Service
public class TokenService {

    private static final String ISSUER = "fieldops-api";

    private final Algorithm algorithm;

    public TokenService() {
        this.algorithm = Algorithm.HMAC256("fieldops-secret-key-dev");
    }

    public String generateToken(User user) {

        Instant expiresAt = Instant.now().plus(8, ChronoUnit.HOURS);

        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(user.getEmail())
                .withClaim("userId", user.getId())
                .withClaim("role", user.getRole().name())
                .withIssuedAt(Instant.now())
                .withExpiresAt(expiresAt)
                .sign(algorithm);
    }

    public String validateToken(String token) {

        try {
            return JWT.require(algorithm)
                    .withIssuer(ISSUER)
                    .build()
                    .verify(token)
                    .getSubject();

        } catch (JWTVerificationException exception) {
            return null;
        }
    }
}
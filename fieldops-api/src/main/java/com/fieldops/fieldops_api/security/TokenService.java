package com.fieldops.fieldops_api.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.fieldops.fieldops_api.entities.User;

@Service
public class TokenService {

    private static final String ISSUER = "fieldops-api";

    private final Algorithm algorithm;
    private final long expirationHours;

    public TokenService(
            @Value("${fieldops.jwt.secret}") String secret,
            @Value("${fieldops.jwt.expiration-hours:8}") long expirationHours) {

        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException(
                    "fieldops.jwt.secret deve ter pelo menos 32 caracteres. "
                            + "Defina a variável de ambiente FIELDOPS_JWT_SECRET."
            );
        }

        this.algorithm = Algorithm.HMAC256(secret);
        this.expirationHours = expirationHours;
    }

    public String generateToken(User user) {

        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirationHours, ChronoUnit.HOURS);

        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(user.getEmail())
                .withClaim("userId", user.getId())
                .withClaim("role", user.getRole().name())
                .withIssuedAt(now)
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

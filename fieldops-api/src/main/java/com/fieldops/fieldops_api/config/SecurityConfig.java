package com.fieldops.fieldops_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.fieldops.fieldops_api.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // Login público
                .requestMatchers("/api/v1/auth/**")
                    .permitAll()

                // Permite que erros da API sejam retornados corretamente
                .requestMatchers("/error")
                    .permitAll()

                // Somente ADMIN
                .requestMatchers("/api/v1/users/**")
                    .hasRole("ADMIN")

                .requestMatchers("/api/v1/clients/**")
                    .hasRole("ADMIN")

                .requestMatchers("/api/v1/sites/**")
                    .hasRole("ADMIN")

                .requestMatchers("/api/v1/equipments/**")
                    .hasRole("ADMIN")

                // ADMIN e SUPERVISOR
                .requestMatchers("/api/v1/inspections/**")
                    .hasAnyRole("ADMIN", "SUPERVISOR")

                .requestMatchers("/api/v1/templates/**")
                    .hasAnyRole("ADMIN", "SUPERVISOR")

                .requestMatchers("/api/v1/non-conformities/**")
                    .hasAnyRole("ADMIN", "SUPERVISOR")

                .requestMatchers("/api/v1/reports/**")
                    .hasAnyRole("ADMIN", "SUPERVISOR")

                .requestMatchers("/api/v1/audit/**")
                    .hasAnyRole("ADMIN", "SUPERVISOR")

                .requestMatchers("/api/v1/settings/**")
                    .hasAnyRole("ADMIN", "SUPERVISOR")

                // Qualquer outra rota exige autenticação
                .anyRequest()
                    .authenticated()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
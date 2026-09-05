package com.fieldops.fieldops_api.config;

import com.fieldops.fieldops_api.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authorizeHttpRequests(auth -> auth

                // Autenticação
                .requestMatchers("/api/v1/auth/**", "/error").permitAll()

                // Usuários
                .requestMatchers("/api/v1/users/**")
                .hasRole("ADMIN")

                // Clientes
                .requestMatchers("/api/v1/clients/**")
                .hasRole("ADMIN")

                // Locais
                .requestMatchers("/api/v1/sites/**")
                .hasRole("ADMIN")

                // Equipamentos
                .requestMatchers("/api/v1/equipments/**")
                .hasRole("ADMIN")

                // Modelos de inspeção
                .requestMatchers("/api/v1/inspection-templates/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // Versões dos modelos
                .requestMatchers("/api/v1/inspection-template-versions/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // Seções dos modelos
                .requestMatchers("/api/v1/template-sections/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // Itens dos modelos
                .requestMatchers("/api/v1/template-items/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // CRIAÇÃO DE INSPEÇÃO
                // Técnico não cria inspeções.
                .requestMatchers(HttpMethod.POST, "/api/v1/inspections/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // CONSULTA DE INSPEÇÕES
                .requestMatchers(HttpMethod.GET, "/api/v1/inspections/**")
                .hasAnyRole("ADMIN", "SUPERVISOR", "TECHNICIAN")

                // Atualização de status
                .requestMatchers(HttpMethod.PATCH, "/api/v1/inspections/**")
                .hasAnyRole("ADMIN", "SUPERVISOR", "TECHNICIAN")

                // Demais endpoints
                .anyRequest().authenticated()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
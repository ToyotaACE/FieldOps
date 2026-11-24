
package com.fieldops.fieldops_api.config;

import com.fieldops.fieldops_api.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
            List.of(
                "http://localhost:5173",
                "http://localhost:8081",
                "http://localhost:8082",
                "http://localhost:19006"
            )
        );

        configuration.setAllowedMethods(
            List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            )
        );

        configuration.setAllowedHeaders(
            List.of(
                "Authorization",
                "Content-Type",
                "Accept"
            )
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // Login e cadastro públicos
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/auth/login",
                    "/api/v1/auth/register"
                ).permitAll()

                // Tratamento de erros
                .requestMatchers("/error").permitAll()

                // Perfil e autenticação
                .requestMatchers("/api/v1/auth/**")
                .authenticated()

                // Lista de técnicos para atribuição de inspeções
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/users/technicians"
                ).hasAnyRole("ADMIN", "SUPERVISOR")
                // Usuários: somente ADMIN
                .requestMatchers("/api/v1/users/**")
                .hasRole("ADMIN")

                // Consulta de clientes, locais e equipamentos (somente leitura):
                // liberada para o aplicativo mobile (ADMIN, SUPERVISOR e TECHNICIAN)
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/clients/**",
                    "/api/v1/sites/**",
                    "/api/v1/equipments/**"
                ).hasAnyRole(
                    "ADMIN",
                    "SUPERVISOR",
                    "TECHNICIAN"
                )

                // Clientes: somente ADMIN
                .requestMatchers("/api/v1/clients/**")
                .hasRole("ADMIN")

                // Locais: somente ADMIN
                .requestMatchers("/api/v1/sites/**")
                .hasRole("ADMIN")

                // Equipamentos: somente ADMIN
                .requestMatchers("/api/v1/equipments/**")
                .hasRole("ADMIN")

                // Modelos de inspeção
                .requestMatchers("/api/v1/inspection-templates/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // Versões dos modelos
                .requestMatchers("/api/v1/inspection-template-versions/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // Consulta de seções: ADMIN, SUPERVISOR e TECHNICIAN
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/template-sections/**"
                ).hasAnyRole(
                    "ADMIN",
                    "SUPERVISOR",
                    "TECHNICIAN"
                )

                // Alteração de seções: somente ADMIN e SUPERVISOR
                .requestMatchers("/api/v1/template-sections/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // Consulta de itens: ADMIN, SUPERVISOR e TECHNICIAN
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/template-items/**"
                ).hasAnyRole(
                    "ADMIN",
                    "SUPERVISOR",
                    "TECHNICIAN"
                )

                // Alteração de itens: somente ADMIN e SUPERVISOR
                .requestMatchers("/api/v1/template-items/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // Execução da inspeção e fila de sincronização: somente o técnico
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/inspections/*/start",
                    "/api/v1/inspections/*/complete",
                    "/api/v1/inspections/*/reopen",
                    "/api/v1/inspections/*/nonconformities",
                    "/api/v1/sync/**",
                    "/api/v1/inspection-evidences/**"
                ).hasRole("TECHNICIAN")

                // Revisão: somente o supervisor
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/inspections/*/review",
                    "/api/v1/inspections/*/approve",
                    "/api/v1/inspections/*/reject"
                ).hasRole("SUPERVISOR")

                // Cancelamento com justificativa: administrador ou supervisor
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/inspections/*/cancel"
                ).hasAnyRole("ADMIN", "SUPERVISOR")

                // Trilha de auditoria: administrador e supervisor
                .requestMatchers("/api/v1/audit-logs/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // Consulta de evidências: perfis autenticados (o serviço valida o escopo)
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/inspection-evidences/**"
                ).hasAnyRole("ADMIN", "SUPERVISOR", "TECHNICIAN")
                // Cadastro de respostas: somente técnicos
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/inspections/*/answers"
                ).hasRole("TECHNICIAN")

                // Criação de inspeções
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/inspections/**"
                ).hasAnyRole("ADMIN", "SUPERVISOR")

                // Consulta de inspeções
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/inspections/**"
                ).hasAnyRole(
                    "ADMIN",
                    "SUPERVISOR",
                    "TECHNICIAN"
                )

                // Atualização de status
                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/v1/inspections/**"
                ).hasAnyRole(
                    "ADMIN",
                    "SUPERVISOR",
                    "TECHNICIAN"
                )

                // Demais endpoints exigem autenticação
                .anyRequest().authenticated()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}

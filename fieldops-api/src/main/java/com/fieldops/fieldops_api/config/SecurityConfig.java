
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
            List.of("http://localhost:5173")
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

                // Perfil, atualização de dados e alteração de senha
                .requestMatchers("/api/v1/auth/**")
                .authenticated()

                // Usuários: somente ADMIN
                .requestMatchers("/api/v1/users/**")
                .hasRole("ADMIN")

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

                // Seções dos modelos
                .requestMatchers("/api/v1/template-sections/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

                // Itens dos modelos
                .requestMatchers("/api/v1/template-items/**")
                .hasAnyRole("ADMIN", "SUPERVISOR")

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

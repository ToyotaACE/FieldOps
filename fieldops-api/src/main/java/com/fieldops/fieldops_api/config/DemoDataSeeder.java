package com.fieldops.fieldops_api.config;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fieldops.fieldops_api.entities.Client;
import com.fieldops.fieldops_api.entities.Equipment;
import com.fieldops.fieldops_api.entities.Inspection;
import com.fieldops.fieldops_api.entities.InspectionPriority;
import com.fieldops.fieldops_api.entities.InspectionSite;
import com.fieldops.fieldops_api.entities.InspectionStatus;
import com.fieldops.fieldops_api.entities.InspectionTemplate;
import com.fieldops.fieldops_api.entities.InspectionTemplateVersion;
import com.fieldops.fieldops_api.entities.ResponseType;
import com.fieldops.fieldops_api.entities.Role;
import com.fieldops.fieldops_api.entities.TemplateItem;
import com.fieldops.fieldops_api.entities.TemplateSection;
import com.fieldops.fieldops_api.entities.User;
import com.fieldops.fieldops_api.repositories.ClientRepository;
import com.fieldops.fieldops_api.repositories.EquipmentRepository;
import com.fieldops.fieldops_api.repositories.InspectionRepository;
import com.fieldops.fieldops_api.repositories.InspectionSiteRepository;
import com.fieldops.fieldops_api.repositories.InspectionTemplateRepository;
import com.fieldops.fieldops_api.repositories.InspectionTemplateVersionRepository;
import com.fieldops.fieldops_api.repositories.TemplateItemRepository;
import com.fieldops.fieldops_api.repositories.TemplateSectionRepository;
import com.fieldops.fieldops_api.repositories.UserRepository;

/**
 * Dados de demonstração. Executa somente com FIELDOPS_SEED_DEMO=true e
 * somente se o supervisor de demonstração ainda não existir.
 *
 * Usuários criados (senhas de DEMONSTRAÇÃO, troque em produção):
 *   admin@fieldops.com       Admin@123456       ADMIN
 *   supervisor@fieldops.com  Super@123456       SUPERVISOR
 *   tecnico@fieldops.com     Tecnico@123456     TECHNICIAN
 *   tecnico2@fieldops.com    Tecnico@123456     TECHNICIAN
 */
@Component
@ConditionalOnProperty(name = "fieldops.seed.demo", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log =
            LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final InspectionSiteRepository siteRepository;
    private final EquipmentRepository equipmentRepository;
    private final InspectionTemplateRepository templateRepository;
    private final InspectionTemplateVersionRepository versionRepository;
    private final TemplateSectionRepository sectionRepository;
    private final TemplateItemRepository itemRepository;
    private final InspectionRepository inspectionRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(
            UserRepository userRepository,
            ClientRepository clientRepository,
            InspectionSiteRepository siteRepository,
            EquipmentRepository equipmentRepository,
            InspectionTemplateRepository templateRepository,
            InspectionTemplateVersionRepository versionRepository,
            TemplateSectionRepository sectionRepository,
            TemplateItemRepository itemRepository,
            InspectionRepository inspectionRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.siteRepository = siteRepository;
        this.equipmentRepository = equipmentRepository;
        this.templateRepository = templateRepository;
        this.versionRepository = versionRepository;
        this.sectionRepository = sectionRepository;
        this.itemRepository = itemRepository;
        this.inspectionRepository = inspectionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {

        if (userRepository.existsByEmail("supervisor@fieldops.com")) {
            log.info("Dados de demonstração já existem; nada a fazer.");
            return;
        }

        createUser("Administrador Demo", "admin@fieldops.com",
                "Admin@123456", Role.ADMIN);

        createUser("Supervisor Demo", "supervisor@fieldops.com",
                "Super@123456", Role.SUPERVISOR);

        User technician = createUser("Técnico Demo", "tecnico@fieldops.com",
                "Tecnico@123456", Role.TECHNICIAN);

        createUser("Técnico Demo 2", "tecnico2@fieldops.com",
                "Tecnico@123456", Role.TECHNICIAN);

        Client client = new Client();
        client.setName("Metalúrgica Alpha");
        client.setDocument("12345678000199");
        client.setActive(true);
        client = clientRepository.save(client);

        InspectionSite site = new InspectionSite();
        site.setName("Unidade Industrial 01");
        site.setAddress("Av. das Indústrias, 1000");
        site.setCity("Sorocaba");
        site.setState("SP");
        site.setActive(true);
        site.setClient(client);
        site = siteRepository.save(site);

        Equipment compressor = new Equipment();
        compressor.setName("Compressor de Ar CP-001");
        compressor.setCategory("Compressor");
        compressor.setSerialNumber("SN-CP-0001");
        compressor.setQrCode("FIELDOPS-CP-001");
        compressor.setActive(true);
        compressor.setSite(site);
        compressor = equipmentRepository.save(compressor);

        Equipment panel = new Equipment();
        panel.setName("Painel Elétrico PE-021");
        panel.setCategory("Painel elétrico");
        panel.setSerialNumber("SN-PE-0021");
        panel.setQrCode("FIELDOPS-PE-021");
        panel.setActive(true);
        panel.setSite(site);
        equipmentRepository.save(panel);

        InspectionTemplateVersion version = createTemplate();

        Inspection inspection = new Inspection();
        inspection.setTitle("Inspeção preventiva do compressor CP-001");
        inspection.setInstructions(
                "Verifique todos os itens e anexe fotos quando solicitado.");
        inspection.setTemplateVersion(version);
        inspection.setClient(client);
        inspection.setSite(site);
        inspection.setEquipment(compressor);
        inspection.setTechnician(technician);
        inspection.setScheduledDate(LocalDate.now());
        inspection.setScheduledTime(LocalTime.of(9, 0));
        inspection.setPriority(InspectionPriority.HIGH);
        inspection.setStatus(InspectionStatus.SCHEDULED);
        inspectionRepository.save(inspection);

        log.info("Dados de demonstração criados. Login: supervisor@fieldops.com / Super@123456");
    }

    private User createUser(
            String name,
            String email,
            String password,
            Role role) {

        User user = new User();

        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setActive(true);

        return userRepository.save(user);
    }

    private InspectionTemplateVersion createTemplate() {

        InspectionTemplate template = new InspectionTemplate();
        template.setTitle("Segurança operacional");
        template.setCategory("Segurança");
        template.setDescription("Checklist de segurança e condições de operação.");
        template.setActive(true);
        template = templateRepository.save(template);

        InspectionTemplateVersion version = new InspectionTemplateVersion();
        version.setTemplate(template);
        version.setVersionNumber(1);
        version.setPublished(true);
        version.setPublishedAt(LocalDateTime.now());
        version = versionRepository.save(version);

        TemplateSection general = createSection(version, "Condições gerais", 1);

        createItem(general, "O equipamento está limpo e sem vazamentos?",
                ResponseType.CONFORMITY, 1, true, true, true, true, null);

        createItem(general, "Operação em funcionamento normal?",
                ResponseType.BOOLEAN, 2, true, false, false, false, null);

        createItem(general, "Estado geral de conservação",
                ResponseType.SINGLE_CHOICE, 3, true, false, false, false,
                "Excelente\nBom\nRegular\nRuim");

        TemplateSection measures = createSection(version, "Medições e registros", 2);

        createItem(measures, "Pressão de operação (bar)",
                ResponseType.NUMBER, 1, true, false, false, false, null);

        createItem(measures, "Data da última manutenção",
                ResponseType.DATE, 2, false, false, false, false, null);

        createItem(measures, "Responsável presente (nome)",
                ResponseType.TEXT_SHORT, 3, false, false, false, false, null);

        createItem(measures, "Observações gerais da inspeção",
                ResponseType.TEXT_LONG, 4, false, false, false, false, null);

        return version;
    }

    private TemplateSection createSection(
            InspectionTemplateVersion version,
            String title,
            int order) {

        TemplateSection section = new TemplateSection();

        section.setTemplateVersion(version);
        section.setTitle(title);
        section.setDisplayOrder(order);

        return sectionRepository.save(section);
    }

    private void createItem(
            TemplateSection section,
            String label,
            ResponseType type,
            int order,
            boolean required,
            boolean requiresObservation,
            boolean critical,
            boolean requiresEvidence,
            String options) {

        TemplateItem item = new TemplateItem();

        item.setSection(section);
        item.setLabel(label);
        item.setResponseType(type);
        item.setDisplayOrder(order);
        item.setRequired(required);
        item.setRequiresObservationOnNonconformity(requiresObservation);
        item.setCriticalOnNonconformity(critical);
        item.setRequiresEvidence(requiresEvidence);
        item.setOptions(options);

        itemRepository.save(item);
    }
}

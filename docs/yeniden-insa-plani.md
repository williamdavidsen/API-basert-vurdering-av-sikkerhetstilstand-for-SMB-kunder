# Yeniden Insa Plani

Bu dokuman, projeyi yeni bir VS Code calisma alaninda duzenli sekilde yeniden kurmak veya tasimak icin hazirlandi. Amac sahte bir commit gecmisi uretmek degil; mevcut projeyi anlayarak, gercek calisma adimlariyla ve acik commit mesajlariyla ilerlemektir.

Kapsam notu: Bu planda ana hedef sadece `API/` klasorunu tasimaktir. `Test/`, `Frontend/`, kok dizindeki `.sln`, ana `README.md` ve `docs/` dosyalari ancak yeni repoda ihtiyac varsa ayrica eklenmelidir.

## Mevcut proje agaci

```text
.
|-- API
|   |-- Controllers
|   |   `-- Api
|   |       |-- AssessmentController.cs
|   |       |-- EmailController.cs
|   |       |-- HeadersController.cs
|   |       |-- PqcController.cs
|   |       |-- ReputationController.cs
|   |       `-- SslController.cs
|   |-- DAL
|   |   |-- Interfaces
|   |   |   |-- IAssessmentRunRepository.cs
|   |   |   |-- IAssetRepository.cs
|   |   |   |-- ICheckResultRepository.cs
|   |   |   |-- ICheckTypesRepository.cs
|   |   |   `-- IFindingsRepository.cs
|   |   |-- Repositories
|   |   |   |-- AssessmentRunRepository.cs
|   |   |   |-- AssetRepository.cs
|   |   |   |-- CheckResultRepository.cs
|   |   |   |-- CheckTypesRepository.cs
|   |   |   `-- FindingsRepository.cs
|   |   |-- ApplicationDbContext.cs
|   |   `-- DtoMapper.cs
|   |-- DTOs
|   |   |-- AssessmentCheckRequest.cs
|   |   |-- AssessmentCheckResult.cs
|   |   |-- AssessmentRunDto.cs
|   |   |-- AssetDto.cs
|   |   |-- CheckResultDto.cs
|   |   |-- CheckTypesDto.cs
|   |   |-- EmailCheckRequest.cs
|   |   |-- EmailCheckResult.cs
|   |   |-- FindingsDto.cs
|   |   |-- HeadersCheckRequest.cs
|   |   |-- HeadersCheckResult.cs
|   |   |-- PqcCheckResult.cs
|   |   |-- ReputationCheckRequest.cs
|   |   |-- ReputationCheckResult.cs
|   |   |-- SslCheckRequest.cs
|   |   |-- SslCheckResult.cs
|   |   `-- SslDetailResult.cs
|   |-- Models
|   |   `-- Entities
|   |       |-- AssessmentRun.cs
|   |       |-- Asset.cs
|   |       |-- CheckResult.cs
|   |       |-- CheckType.cs
|   |       `-- Finding.cs
|   |-- Properties
|   |   `-- launchSettings.json
|   |-- Services
|   |   |-- AssessmentCheckingService.cs
|   |   |-- DnsAnalysisClient.cs
|   |   |-- EmailCheckingService.cs
|   |   |-- HeadersCheckingService.cs
|   |   |-- HttpHeadersProbeClient.cs
|   |   |-- MozillaObservatoryClient.cs
|   |   |-- PqcCheckingService.cs
|   |   |-- ReputationCheckingService.cs
|   |   |-- SslCheckingService.cs
|   |   |-- SslLabsClient.cs
|   |   |-- SslLabsModels.cs
|   |   `-- VirusTotalClient.cs
|   |-- appsettings.Development.json
|   |-- appsettings.json
|   |-- appsettings.Local.json
|   |-- global.json
|   |-- Program.cs
|   `-- SecurityAssessmentAPI.csproj
|-- docs
|   |-- sekvens-guncel.drawio
|   |-- sekvens-guncel.svg
|   `-- yeniden-insa-plani.md
|-- Frontend
|   `-- try.txt
|-- Test
|   |-- AssessmentBatchRunner
|   |   |-- AssessmentBatchRunner.csproj
|   |   |-- domains.txt
|   |   |-- Program.cs
|   |   |-- README.md
|   |   `-- weak-domains.txt
|   `-- delete.txt
|-- .gitignore
|-- API-basert-vurdering-av-sikkerhetstilstand-for-SMB-kunder.sln
`-- README.md
```

Not: `appsettings.Local.json` yerel ayar/secrets icerebilir. Yeni repoya tasirken bunu commit etmek yerine `appsettings.Local.example.json` gibi ornek dosya kullanmak daha dogru olur.

## En kolay ve dogru yontem

Eger bu proje zaten seninse ve sadece yeni bir klasorde/VS Code ortaminda API klasorunu temizlemek istiyorsan en dogru yontem tek bir acik commit ile baslamaktir:

```text
chore: import existing API baseline
```

Sonraki commitlerde gercekten yaptigin duzenlemeleri ekle:

```text
docs: document assessment workflow
fix(ssl): improve certificate detail mapping
test(batch): add weak domain sample list
```

Bu yol temiz, acik ve savunulabilir olur. Commit gecmisinin "bastan yazilmis gibi" gorunmesi icin tarihlerle veya yapay parcali commitlerle oynamak dogru degildir.

## 2 haftalik gercekci calisma sirasi

Bu plan, sadece `API/` klasorunu yeni ortamda anlayarak yeniden kurmak icindir. Her gunun sonunda calisan veya derlenebilir bir parca hedeflenir. Kapsam daraldigi icin 10-12 gun de yeterli olabilir; 14 gun daha rahat ve daha gercekci bir calisma temposu verir.

### Gun 1: Temel iskelet

- Yeni repository ac.
- `.gitignore`, `API/SecurityAssessmentAPI.csproj`, `API/global.json` dosyalarini olustur.
- Yeni repoda sadece API olacaksa `.sln` zorunlu degil; istersen repo kokunde sonradan yeni bir solution olusturabilirsin.
- `API/Program.cs` icinde controller, Swagger/OpenAPI ve InMemory EF Core altyapisini ekle.
- Commit: `chore: scaffold solution and API project`

### Gun 2: Domain modeli

- `API/Models/Entities` altindaki entity dosyalarini ekle: `Asset`, `AssessmentRun`, `CheckType`, `CheckResult`, `Finding`.
- `API/DAL/ApplicationDbContext.cs` dosyasini ekle.
- Derleme kontrolu yap.
- Commit: `feat(data): add assessment domain entities`

### Gun 3: DTO katmani

- Basit DTO dosyalarini ekle: `AssetDto`, `AssessmentRunDto`, `CheckTypesDto`, `CheckResultDto`, `FindingsDto`.
- Check request/result DTO dosyalarini ekle: `Ssl`, `Headers`, `Email`, `Reputation`, `Pqc`, `Assessment`.
- `DtoMapper.cs` dosyasini ekle.
- Commit: `feat(api): add DTO contracts for assessment modules`

### Gun 4: Repository katmani

- `DAL/Interfaces` dosyalarini ekle.
- `DAL/Repositories` implementasyonlarini ekle.
- `Program.cs` icinde repository dependency injection kayitlarini tamamla.
- Commit: `feat(data): add repository layer`

### Gun 5: Temel controller yapisi

- `AssessmentController`, `SslController`, `HeadersController`, `EmailController`, `ReputationController`, `PqcController` dosyalarini endpoint iskeletiyle ekle.
- Henuz servisler tam degilse gecici olarak derlenebilir, basit response donduren halini kullan.
- Commit: `feat(api): add assessment controllers`

### Gun 6: HTTP ve DNS client altyapisi

- `DnsAnalysisClient`, `HttpHeadersProbeClient`, `MozillaObservatoryClient`, `SslLabsClient`, `SslLabsModels`, `VirusTotalClient` dosyalarini ekle.
- `Program.cs` icinde HttpClient kayitlarini tamamla.
- Commit: `feat(integrations): add external check clients`

### Gun 7: Headers modulu

- `HeadersCheckingService.cs` dosyasini ekle.
- `HeadersController` ile baglantisini tamamla.
- Swagger uzerinden `/api/headers/check/{domain}` test et.
- Commit: `feat(headers): implement security header checks`

### Gun 8: Email modulu

- `EmailCheckingService.cs` dosyasini ekle.
- SPF, DMARC, DKIM, MX kontrol akisini calistir.
- `/api/email/check/{domain}` endpointini test et.
- Commit: `feat(email): implement DNS based email security checks`

### Gun 9: Reputation modulu

- `ReputationCheckingService.cs` dosyasini ekle.
- VirusTotal veya fallback veri akisini ayarla.
- Secrets gerekiyorsa `appsettings.Local.json` dosyasini yerelde tut, commit etme.
- Commit: `feat(reputation): implement domain reputation checks`

### Gun 10: SSL/TLS modulu

- `SslCheckingService.cs` dosyasini ekle.
- `SslDetailResult.cs` ve ilgili DTO alanlarini kontrol et.
- SSL Labs ve direct TLS fallback akisini test et.
- Commit: `feat(ssl): implement certificate and TLS checks`

### Gun 11: PQC modulu

- `PqcCheckingService.cs` dosyasini ekle.
- TLS gruplari ve PQC/hybrid sinyal yorumlamasini bagla.
- `/api/pqc/check/{domain}` endpointini test et.
- Commit: `feat(pqc): add post quantum readiness checks`

### Gun 12: Birlesik assessment

- `AssessmentCheckingService.cs` dosyasini ekle.
- Modul agirliklari, final skor, grade, status ve alert listesini bagla.
- `/api/assessment/check/{domain}` endpointini test et.
- Commit: `feat(assessment): combine module scores into final assessment`

### Gun 13: API smoke test ve yerel ayarlar

- `appsettings.json` ve `appsettings.Development.json` dosyalarini kontrol et.
- `appsettings.Local.json` dosyasini commit etme; gerekiyorsa `appsettings.Local.example.json` hazirla.
- Swagger uzerinden tum endpointlere birer basit domain ile smoke test yap.
- Commit: `test(api): smoke test assessment endpoints`

### Gun 14: API dokumantasyonu ve temizlik

- Yeni repoda API icin kisa bir `README.md` ekle veya `API/README.md` hazirla.
- Calistirma komutlarini, portu ve endpoint listesini yaz.
- `Test/`, `Frontend/` ve eski docs dosyalarini tasima; sadece ihtiyac olursa sonra ekle.
- Son build ve endpoint smoke test yap.
- Commit: `docs: document API setup and endpoints`

## Kontrol listesi

- `dotnet restore` calisiyor.
- `dotnet build` basarili.
- API Swagger aciliyor.
- Her tekil endpoint en az bir domain ile test edildi.
- Combined assessment endpoint calisiyor.
- `appsettings.Local.json`, API key veya lokal path gibi ozel bilgiler commit edilmedi.
- README icindeki calistirma komutlari gercek port ve proje yapisiyla uyumlu.

# Implémentation du Système de Règles ✅

## Vue d'ensemble

Le système de règles personnalisables a été intégré avec succès dans l'application Orylo. Il permet aux utilisateurs de définir des règles de détection de fraude qui s'appliquent automatiquement sur les transactions Stripe en temps réel.

## 📁 Fichiers créés/modifiés

### 1. Schéma de base de données
- ✅ `lib/schemas/rules.ts` - Déjà existant
  - Table PostgreSQL avec les champs : id, organizationId, name, description, enabled, priority, conditions, action, threshold

### 2. Actions serveur
- ✅ `lib/actions/rules.ts` - Modifié
  - Ajout de `getRulesByOrganization()` pour récupérer les règles depuis la DB

### 3. Moteur de règles (nouveau)
- ✅ `lib/fraud-detection/rules-engine.ts` - **CRÉÉ**
  - `applyRules()` : Applique les règles sur une transaction
  - `buildRuleContext()` : Construit le contexte d'évaluation
  - `evaluateCondition()` : Évalue une condition
  - `evaluateRule()` : Évalue une règle complète
  - Support de 12 opérateurs : eq, ne, gt, gte, lt, lte, in, not_in, contains, starts_with, ends_with, regex
  - Support des conditions AND/OR

### 4. Templates de règles (nouveau)
- ✅ `lib/fraud-detection/rule-templates.ts` - **CRÉÉ**
  - 15+ templates prédéfinis
  - Catégories : montants, géographie, cartes, email, combinaisons
  - Fonctions utilitaires : getTemplatesByCategory, getTemplateById, getTemplatesByTag

### 5. Tests (nouveau)
- ✅ `lib/fraud-detection/__tests__/rules-engine.test.ts` - **CRÉÉ**
  - Tests unitaires pour tous les opérateurs
  - Tests de scénarios réels
  - Tests d'edge cases

### 6. Documentation (nouveau)
- ✅ `lib/fraud-detection/README.md` - **CRÉÉ**
  - Documentation complète du système
  - Exemples d'utilisation
  - Guide des opérateurs et champs disponibles

### 7. Export centralisé (nouveau)
- ✅ `lib/fraud-detection/index.ts` - **CRÉÉ**
  - Export de tous les modules de détection de fraude

### 8. Intégration webhook Stripe
- ✅ `app/api/webhooks/stripe/[accountId]/route.ts` - **MODIFIÉ**
  - Ajout de `applyRulesOnPayment()` qui s'exécute sur `payment_intent.succeeded`
  - Actions automatiques selon le résultat :
    - **block** : Remboursement automatique + alerte critique
    - **review** : Alerte d'avertissement
    - **alert_only** : Alerte informative
    - **require_3ds** : (À implémenter)

### 9. Interface utilisateur
- ✅ `app/(main)/dashboard/rules/page.tsx` - **MODIFIÉ**
  - Récupération des règles côté serveur
  - Vérification de l'authentification
  - Passage des données au composant client

- ✅ `app/(main)/dashboard/rules/rules-client.tsx` - **MODIFIÉ**
  - Affichage des règles réelles depuis la DB
  - Suppression des données mockées
  - Gestion de l'état vide

- ✅ `app/(main)/dashboard/rules/create-rule-dialog.tsx` - Déjà existant
  - Dialog de création de règles avec formulaire en 3 étapes

## 🎯 Fonctionnalités

### Champs disponibles pour les règles
```typescript
{
  amount: number,           // Montant en centimes
  currency: string,         // Code devise (eur, usd...)
  country: string,          // Code pays ISO (FR, US...)
  ipAddress: string,        // Adresse IP du client
  cardBrand: string,        // Marque de carte (visa, mastercard...)
  cardLast4: string,        // 4 derniers chiffres
  email: string,            // Email du client
  metadata: object,         // Métadonnées personnalisées
  paymentIntent: object,    // Objet Stripe PaymentIntent complet
  charge: object           // Objet Stripe Charge complet
}
```

### Opérateurs supportés
- `eq` - Égal
- `ne` - Différent
- `gt` - Supérieur
- `gte` - Supérieur ou égal
- `lt` - Inférieur
- `lte` - Inférieur ou égal
- `in` - Dans la liste
- `not_in` - Pas dans la liste
- `contains` - Contient (string)
- `starts_with` - Commence par
- `ends_with` - Termine par
- `regex` - Expression régulière

### Actions disponibles
1. **block** : Bloque et rembourse la transaction
2. **review** : Marque pour révision manuelle
3. **require_3ds** : Exige 3D Secure (à implémenter)
4. **alert_only** : Génère une alerte sans bloquer

### Priorité des règles
- Les règles sont triées par priorité décroissante (100 → 0)
- La première règle qui matche détermine l'action
- Les autres règles matchées sont enregistrées mais n'influencent pas l'action

## 📊 Exemples de règles

### 1. Bloquer les gros montants
```json
{
  "name": "Bloquer transactions > 5000€",
  "priority": 90,
  "action": "block",
  "conditions": {
    "field": "amount",
    "operator": "gt",
    "value": 500000
  }
}
```

### 2. Bloquer pays à haut risque
```json
{
  "name": "Bloquer pays à haut risque",
  "priority": 100,
  "action": "block",
  "conditions": {
    "field": "country",
    "operator": "in",
    "value": ["XX", "YY", "ZZ"]
  }
}
```

### 3. Réviser emails suspects
```json
{
  "name": "Emails temporaires",
  "priority": 80,
  "action": "review",
  "conditions": {
    "or": [
      { "field": "email", "operator": "ends_with", "value": "@tempmail.com" },
      { "field": "email", "operator": "ends_with", "value": "@guerrillamail.com" }
    ]
  }
}
```

### 4. Conditions multiples (AND)
```json
{
  "name": "Gros montants USA",
  "priority": 60,
  "action": "review",
  "conditions": {
    "and": [
      { "field": "amount", "operator": "gt", "value": 50000 },
      { "field": "country", "operator": "eq", "value": "US" }
    ]
  }
}
```

## 🔄 Flux d'exécution

```
1. Webhook Stripe reçu (payment_intent.succeeded)
   ↓
2. Vérification signature + limites Autumn
   ↓
3. Construction du contexte (buildRuleContext)
   ↓
4. Application des règles (applyRules)
   ↓
5. Évaluation de toutes les règles actives
   ↓
6. Sélection de la règle avec la plus haute priorité
   ↓
7. Exécution de l'action :
   - block → Remboursement + Alerte critique
   - review → Alerte d'avertissement
   - alert_only → Alerte informative
   ↓
8. Traitement normal du webhook (handlers)
   ↓
9. Détection de card testing
   ↓
10. Réponse au webhook
```

## 🧪 Tests

Pour exécuter les tests :

```bash
bun test lib/fraud-detection/__tests__/rules-engine.test.ts
```

## 📝 Utilisation

### Créer une règle via l'interface
1. Aller sur `/dashboard/rules`
2. Cliquer sur "Créer une règle"
3. Remplir le formulaire en 3 étapes :
   - Informations (nom, description, priorité)
   - Action (block, review, require_3ds, alert_only)
   - Conditions (champ, opérateur, valeur)
4. Valider

### Créer une règle via code
```typescript
import { createRule } from "@/lib/actions/rules";

await createRule({
  organizationId: "org_xxx",
  name: "Ma règle",
  description: "Description",
  enabled: true,
  priority: 50,
  action: "block",
  conditions: {
    field: "amount",
    operator: "gt",
    value: 100000
  }
});
```

### Appliquer les règles manuellement
```typescript
import { applyRules, buildRuleContext } from "@/lib/fraud-detection/rules-engine";

const context = buildRuleContext(paymentIntent, charge);
const result = await applyRules(organizationId, context);

if (result.action === "block") {
  // Bloquer la transaction
}
```

## 🚀 Prochaines étapes

- [ ] Implémenter `require_3ds` côté Stripe
- [ ] Ajouter des règles basées sur la vélocité (ex: "3 transactions en 1h")
- [ ] Ajouter des règles temporelles (ex: "entre 22h et 6h")
- [ ] Interface de test des règles avec données historiques
- [ ] Statistiques d'efficacité des règles
- [ ] Suggestions de règles par ML
- [ ] Import/Export de règles
- [ ] Versioning des règles

## 📚 Documentation complète

Voir `lib/fraud-detection/README.md` pour la documentation détaillée.

## ✅ Statut

**IMPLÉMENTATION COMPLÈTE ET FONCTIONNELLE** 🎉

Le système de règles est maintenant :
- ✅ Intégré dans les webhooks Stripe
- ✅ Connecté à la base de données
- ✅ Testé avec des tests unitaires
- ✅ Documenté
- ✅ Prêt à l'emploi

Les règles s'appliquent automatiquement sur chaque transaction Stripe reçue via webhook.


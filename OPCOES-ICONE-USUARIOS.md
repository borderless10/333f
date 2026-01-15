# 🎨 OPÇÕES DE ÍCONE PARA USUÁRIOS

## ✅ Atual: supervisor-account

```typescript
<MaterialIcons name="supervisor-account" size={28} color={color} />
```

Ícone: 👥 (pessoa com supervisão)

---

## 🔄 ALTERNATIVAS (Se ainda estiver desalinhado)

### Opção 1: people-alt
```typescript
<MaterialIcons name="people-alt" size={28} color={color} />
```
Ícone: 👥 (variação do people)

### Opção 2: account-circle
```typescript
<MaterialIcons name="account-circle" size={28} color={color} />
```
Ícone: 👤 (pessoa em círculo)

### Opção 3: contacts
```typescript
<MaterialIcons name="contacts" size={28} color={color} />
```
Ícone: 📇 (contatos)

### Opção 4: recent-actors
```typescript
<MaterialIcons name="recent-actors" size={28} color={color} />
```
Ícone: 👥 (múltiplas pessoas)

### Opção 5: people-outline
```typescript
<MaterialIcons name="people-outline" size={28} color={color} />
```
Ícone: 👥 (contorno)

---

## 🧪 COMO TESTAR RAPIDAMENTE

1. Abra: `app/(tabs)/_layout.tsx`

2. Na linha do ícone de usuários, troque o nome:
```typescript
// Teste cada um:
name="supervisor-account"  // Atual
name="people-alt"          // Alternativa 1
name="account-circle"      // Alternativa 2
name="contacts"            // Alternativa 3
```

3. Salve o arquivo (Ctrl+S)

4. No Expo, pressione 'r' para reload

5. Veja qual fica melhor alinhado!

---

## ✅ RECOMENDAÇÃO

**Melhor alinhamento**: `supervisor-account` ou `people-alt`

Se ainda assim não ficar bom, podemos:
- Ajustar com `marginTop` ou `marginBottom`
- Usar um ícone diferente
- Criar um componente customizado

---

**Teste**: `supervisor-account` primeiro  
**Se não funcionar**: Me avise qual ficou melhor!  

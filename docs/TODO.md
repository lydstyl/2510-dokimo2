- Dans mon package.json je souhaite avoir un script qui permet de sauver la base de données de la meme façon que la copie backup qui est faite dans reset-db.sh mais sans faire le reset. Et en plus de créer un backup avec la date je souhaite aussi créer un deuxième backup qui va remplacer le fichier dev copy.db

- Ajouter les locataires
- Je souhaite avoir un outils qui permet de calculer le prorata temporis en fonction de la période restante à courir pour le premier mois de location pour un locataire entrant et aussi ce qu'il reste à payer pour le locataire sortant.
- ajouter une note sur les baux au format text ou markdown
- bug HDM bail Historique des Paiements (24 derniers)
- Il y a un bug dans la page /dashboard/leases/008ac2f6-8e65-4235-b313-de3875f9fd98/payments Historique des Paiements (24 derniers) au niveau de la colonne MOIS du tableau nous avons des mois du septembre 2031 au août 2033. C'est peut être lié au fait que quand j'ai créé le bail j'ai indiqué une date de fin bail au 31/08/2033 que j'ai ensuite enlevé (modifié). Corriges ce bug, il faut voir les 24 derniers mois et nous somme en novembre 2025 aussi je ne veux pas voir 24 mois si la date du début du bail est plus jeune que 24 mois. Par exemple si le bail a commencé il y a 8 mois alors je dois voir 8 mois et si le bail a commencé il y a 26 mois alors je veux voir maximum 24 mois.
- je veux aussi pouvoir ajouter des notes à un locataire via la modal de création ou de modification d'un loctaire.

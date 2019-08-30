describe('Smoke Test', function() {
    it('Homepage works', function() {
        cy.visit('/');
        cy.contains('Schedule regular HTTP requests to your webapp.');
        cy.contains('Login').click();

        cy.url().should('include', '/login');
    });
});

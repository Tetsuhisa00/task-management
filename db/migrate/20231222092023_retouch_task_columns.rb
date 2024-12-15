class RetouchTaskColumns < ActiveRecord::Migration[7.0]
  def change
    change_column :tasks, :work_output, :string
    remove_column :tasks, :work_days
  end
end
